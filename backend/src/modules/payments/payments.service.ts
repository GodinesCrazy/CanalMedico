import crypto from 'crypto';
import prisma from '@/database/prisma';
import env from '@/config/env';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import consultationsService from '../consultations/consultations.service';
import mercadopagoService from './mercadopago.service';

export interface CreatePaymentSessionDto {
  consultationId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export class PaymentsService {
  /**
   * Crea preferencia de pago MercadoPago.
   * Si consultationId no se envía, se resuelve la consulta PENDING del paciente (userId).
   */
  async createPaymentSession(data: CreatePaymentSessionDto, userId?: string) {
    try {
      let consultationId = data.consultationId?.trim() || undefined;

      if (!consultationId) {
        if (!userId) {
          throw createError('No autenticado', 401);
        }
        // Resolver consulta PENDING del paciente (raw para evitar P2022 en prod)
        const patients = await prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM patients WHERE "userId" = ${userId} LIMIT 1
        `;
        if (!patients.length) {
          throw createError('Paciente no encontrado', 404);
        }
        const patientId = patients[0].id;
        const pendings = await prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM consultations
          WHERE "patientId" = ${patientId} AND status = 'PENDING'
          ORDER BY "createdAt" DESC
        `;
        if (pendings.length === 0) {
          throw createError('No tienes una consulta pendiente de pago', 404);
        }
        if (pendings.length > 1) {
          throw createError('Tienes más de una consulta pendiente; indica consultationId', 400);
        }
        consultationId = pendings[0].id;
      }

      // FIX P2022/prod: raw SQL para evitar Prisma relations (schema mismatch en prod)
      const rows = await prisma.$queryRaw<
        { id: string; type: string; status: string; tarifaConsulta: unknown; tarifaUrgencia: unknown; email: string | null }[]
      >`
        SELECT c.id, c.type, c.status, d."tarifaConsulta", d."tarifaUrgencia", u.email
        FROM consultations c
        JOIN doctors d ON c."doctorId" = d.id
        JOIN patients p ON c."patientId" = p.id
        JOIN users u ON p."userId" = u.id
        WHERE c.id = ${consultationId}
        LIMIT 1
      `;

      if (!rows?.length) {
        throw createError('Consulta no encontrada', 404);
      }

      const row = rows[0];
      if (row.status !== 'PENDING') {
        throw createError('La consulta ya tiene un pago procesado', 400);
      }

      const rawAmount = row.type === 'URGENCIA' ? row.tarifaUrgencia : row.tarifaConsulta;
      const amountValue = Math.max(0, Number(rawAmount ?? 0) || 0);
      if (amountValue <= 0 || !Number.isFinite(amountValue)) {
        throw createError('La tarifa no esta configurada', 400);
      }

      const fee = Math.round(amountValue * env.STRIPE_COMMISSION_FEE);
      const netAmount = Math.max(0, amountValue - fee);

      const payerEmail = (typeof row.email === 'string' ? row.email.trim() : '') || 'paciente@canalmedico.cl';

      const title = `Consulta medica - ${row.type === 'URGENCIA' ? 'Urgencia' : 'Normal'}`;
      let preference: { id?: string; init_point?: string; sandbox_init_point?: string };
      try {
        preference = await mercadopagoService.createPreference(
          row.id,
          title,
          amountValue,
          payerEmail,
          data.successUrl,
          data.cancelUrl
        );
      } catch (mpErr: unknown) {
        const err = mpErr as { message?: string; response?: { status?: number } };
        logger.error('MercadoPago createPreference error', {
          message: err?.message,
          statusCode: err?.response?.status,
        });
        throw createError('No se pudo crear la preferencia de pago. Intente mas tarde.', 400);
      }

      // initPoint: init_point ?? sandbox_init_point (MP puede devolver solo uno)
      const initPoint = (preference?.init_point ?? preference?.sandbox_init_point) ?? '';
      const prefId = preference?.id ?? '';
      if (!initPoint || typeof initPoint !== 'string' || !prefId) {
        logger.error('MercadoPago respuesta incompleta', {
          hasPreference: !!preference,
          hasId: !!prefId,
          hasInitPoint: !!preference?.init_point,
          hasSandboxInitPoint: !!preference?.sandbox_init_point,
        });
        throw createError('MercadoPago no devolvio URL de pago. Intente mas tarde.', 400);
      }

      // PROD-SAFE: raw INSERT solo columnas garantizadas (init+add_mercadopago tienen amount,fee,netAmount,status,consultationId)
      const paymentId = crypto.randomUUID();
      try {
        await prisma.$executeRaw`
          INSERT INTO payments (id, amount, fee, "netAmount", status, "consultationId", "createdAt", "updatedAt")
          VALUES (${paymentId}, ${amountValue}, ${fee}, ${netAmount}, 'PENDING', ${row.id}, NOW(), NOW())
        `;
      } catch (insertErr: unknown) {
        const msg = String((insertErr as { message?: string })?.message ?? '');
        if (msg.includes('consultationId') || msg.includes('unique') || msg.includes('duplicate')) {
          throw createError('Ya existe un pago pendiente para esta consulta', 400);
        }
        logger.error('Error al insertar payment:', insertErr);
        throw createError('Error al registrar el pago. Intente mas tarde.', 400);
      }

      logger.info(`Preferencia MercadoPago creada: ${prefId} - Consulta: ${row.id}`);

      return {
        preferenceId: prefId,
        initPoint,
        sandboxInitPoint: preference?.sandbox_init_point ?? initPoint,
      };
    } catch (error) {
      logger.error('Error al crear sesion de pago:', error);
      throw error;
    }
  }

  /**
   * Webhook MercadoPago: idempotente.
   * Si approved → payment.status = PAID, consultation.status = ACTIVE.
   */
  async handleWebhook(_signature: string, body: any, _reqHeaders?: Record<string, string>) {
    try {
      const { type, data } = body;

      if (!type || !data || !data.id) {
        logger.warn('Webhook recibido con formato invalido:', { type, hasData: !!data });
        return { received: true, error: 'Invalid webhook format' };
      }

      if (type === 'payment') {
        const paymentId = data.id;
        
        // VALIDACIÃ“N CRÃTICA: Verificar que el pago existe en MercadoPago antes de procesar
        // Esto es la validaciÃ³n principal de MercadoPago (no usan firmas como Stripe)
        let paymentInfo;
        try {
          paymentInfo = await mercadopagoService.getPaymentInfo(paymentId);
        } catch (error: any) {
          logger.error(`Error al obtener informacion del pago ${paymentId} desde MercadoPago:`, {
            error: error.message,
            paymentId,
          });
          // Si no se puede verificar en MercadoPago, rechazar webhook
          return { received: true, error: 'Payment not found in MercadoPago - webhook rechazado' };
        }

        // VALIDACIÃ“N ADICIONAL: Verificar que el pago tiene external_reference vÃ¡lido
        if (!paymentInfo || !paymentInfo.external_reference) {
          logger.warn(`Webhook de pago ${paymentId} sin external_reference valido`, {
            paymentId,
            hasPaymentInfo: !!paymentInfo,
          });
          return { received: true, error: 'Invalid payment reference - webhook rechazado' };
        }
        
        // VALIDACIÃ“N ADICIONAL: Verificar que el external_reference corresponde a una consulta vÃ¡lida
        const consultationId = paymentInfo.external_reference;
        const consultation = await prisma.consultation.findUnique({
          where: { id: consultationId },
        });
        // Idempotencia temprana: si ya registramos este payment como PAID para esta consulta, ignorar
        try {
          const alreadyProcessed = await prisma.payment.findFirst({
            where: {
              consultationId,
              mercadopagoPaymentId: String(paymentId),
              status: 'PAID',
            },
          });
          if (alreadyProcessed) {
            logger.info(`Webhook idempotente ignorado para pago ${paymentId} (consulta ${consultationId})`);
            return { received: true };
          }
        } catch (e) {
          logger.warn('Idempotency check failed (continuando):', e);
        }
        
        if (!consultation) {
          logger.warn(`Webhook de pago ${paymentId} con external_reference invalido: consulta ${consultationId} no existe`, {
            paymentId,
            consultationId,
          });
          return { received: true, error: 'Invalid consultation reference - webhook rechazado' };
        }

        const status = paymentInfo.status;

        logger.info(`Procesando webhook pago ${paymentId} para consulta ${consultationId}. Estado: ${status}`);

        const localPayment = await prisma.payment.findUnique({
          where: { consultationId },
        });

        // Validar moneda y monto contra registro local
        const paymentCurrency = (paymentInfo.currency_id || '').toString().toUpperCase();
        if (paymentCurrency && paymentCurrency !== 'CLP') {
          logger.warn('Webhook con moneda no permitida', { paymentId, paymentCurrency });
          return { received: true, error: 'Invalid currency' };
        }
        const paidAmount = Number(paymentInfo.transaction_amount || (paymentInfo.transaction_details && paymentInfo.transaction_details.total_paid_amount) || 0);
        const expectedAmount = localPayment ? Number(localPayment.amount) : 0;
        if (!paidAmount || Math.round(paidAmount) !== Math.round(expectedAmount)) {
          logger.error('Monto de pago no coincide con el esperado', { paymentId, paidAmount, expected: localPayment?.amount, consultationId });
          return { received: true, error: 'Amount mismatch' };
        }

        if (localPayment) {
          // Idempotencia adicional: si ya está PAID en local, ignorar
          if (status === 'approved' && localPayment.status === 'PAID') {
            logger.info('Pago ya estaba PAID (idempotente)', { paymentId, consultationId });
            return { received: true };
          }
          let newStatus = localPayment.status;

          if (status === 'approved') {
            newStatus = 'PAID';
          } else if (status === 'rejected' || status === 'cancelled') {
            newStatus = 'FAILED';
          }

          await prisma.payment.update({
            where: { id: localPayment.id },
            data: {
              status: newStatus,
              mercadopagoPaymentId: paymentId.toString(),
              paidAt: status === 'approved' ? new Date() : localPayment.paidAt,
            },
          });

          if (status === 'approved' && localPayment.status !== 'PAID') {
            const consultation = await prisma.consultation.findUnique({
              where: { id: consultationId },
              include: {
                doctor: true,
              },
            });

            if (consultation) {
              let payoutStatus = 'PENDING';
              let payoutDate = null;

              if (consultation.doctor.payoutMode === 'IMMEDIATE') {
                payoutStatus = 'PAID_OUT';
                payoutDate = new Date();
              } else {
                payoutStatus = 'PENDING';
              }

              await prisma.payment.update({
                where: { id: localPayment.id },
                data: {
                  payoutStatus,
                  payoutDate,
                },
              });

              logger.info(`Pago ${localPayment.id} marcado como ${payoutStatus} (modo: ${consultation.doctor.payoutMode})`);
            }

            await consultationsService.activate(consultationId, localPayment.id);
            logger.info(`Consulta ${consultationId} activada tras pago exitoso`);
          }
        }
      } else {
        logger.info(`Webhook recibido de tipo desconocido: ${type}`);
      }

      return { received: true };
    } catch (error) {
      logger.error('Error al procesar webhook:', error);
      const isCriticalError = error instanceof Error && 
        (error.message.includes('database') || error.message.includes('connection'));
      
      if (isCriticalError) {
        throw error;
      }
      
      return { received: true, error: 'Error processing webhook' };
    }
  }

  async getPaymentByConsultation(consultationId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { consultationId },
        include: {
          consultation: true,
        },
      });

      if (!payment) {
        throw createError('Pago no encontrado', 404);
      }

      return payment;
    } catch (error) {
      logger.error('Error al obtener pago:', error);
      throw error;
    }
  }

  async getPaymentsByDoctor(doctorId: string, page?: number, limit?: number) {
    try {
      const { skip, take } = require('@/utils/pagination').getPaginationParams(page, limit);

      const where = {
        consultation: {
          doctorId,
        },
      };

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take,
          include: {
            consultation: {
              include: {
                patient: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.payment.count({ where }),
      ]);

      return require('@/utils/pagination').createPaginatedResponse(
        payments,
        total,
        page || 1,
        limit || 10
      );
    } catch (error) {
      logger.error('Error al obtener pagos del doctor:', error);
      throw error;
    }
  }
}

export default new PaymentsService();
