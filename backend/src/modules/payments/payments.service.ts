import prisma from '@/database/prisma';
import env from '@/config/env';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import consultationsService from '../consultations/consultations.service';
import mercadopagoService from './mercadopago.service';

export interface CreatePaymentSessionDto {
  consultationId: string;
  successUrl?: string; // Deep link para app móvil o URL web (opcional)
  cancelUrl?: string;  // Deep link para app móvil o URL web (opcional)
}

export class PaymentsService {
  async createPaymentSession(data: CreatePaymentSessionDto) {
    try {
      // Obtener consulta
      const consultation = await prisma.consultation.findUnique({
        where: { id: data.consultationId },
        include: {
          doctor: true,
          patient: {
            include: {
              user: true
            }
          },
        },
      });

      if (!consultation) {
        throw createError('Consulta no encontrada', 404);
      }

      if (consultation.status !== 'PENDING') {
        throw createError('La consulta ya tiene un pago procesado', 400);
      }

      // Calcular monto según tipo de consulta
      const amountValue = consultation.type === 'URGENCIA'
        ? Number(consultation.doctor.tarifaUrgencia)
        : Number(consultation.doctor.tarifaConsulta);

      if (amountValue <= 0) {
        throw createError('La tarifa no está configurada', 400);
      }

      // Calcular fee y monto neto
      const fee = Math.round(amountValue * env.STRIPE_COMMISSION_FEE); // Usamos la misma variable de entorno para la comisión
      const netAmount = amountValue - fee;

      // Obtener email del pagador (paciente)
      // Asumimos que el paciente tiene un usuario asociado, si no, usamos un email genérico
      const payerEmail = consultation.patient.user?.email || 'paciente@canalmedico.cl';

      // Crear preferencia en MercadoPago
      const title = `Consulta médica - ${consultation.type === 'URGENCIA' ? 'Urgencia' : 'Normal'}`;
      const preference = await mercadopagoService.createPreference(
        consultation.id,
        title,
        amountValue,
        payerEmail,
        data.successUrl, // URL de éxito (puede ser deep link para app móvil)
        data.cancelUrl  // URL de cancelación (puede ser deep link para app móvil)
      );

      // Crear registro de pago
      const payment = await prisma.payment.create({
        data: {
          amount: amountValue,
          fee,
          netAmount,
          status: 'PENDING',
          mercadopagoPreferenceId: preference.id,
          consultationId: consultation.id,
        },
      });

      logger.info(`Preferencia MercadoPago creada: ${preference.id} - Consulta: ${consultation.id}`);

      return {
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
        payment,
      };
    } catch (error) {
      logger.error('Error al crear sesión de pago:', error);
      throw error;
    }
  }

  async handleWebhook(_signature: string, body: any) {
    try {
      // MercadoPago envía el ID del recurso en el body o query params dependiendo del tipo de notificación
      // Para Webhooks v1 (IPN), recibimos type y data.id
      // 
      // VALIDACIÓN DE SEGURIDAD:
      // 1. Verificamos que el payment existe en MercadoPago (usando access token)
      // 2. Validamos que el external_reference corresponde a una consulta válida
      // 3. Solo procesamos si el payment está en estado válido

      const { type, data } = body;

      if (!type || !data || !data.id) {
        logger.warn('Webhook recibido con formato inválido:', body);
        return { received: true, error: 'Invalid webhook format' };
      }

      if (type === 'payment') {
        const paymentId = data.id;
        
        // Validar que el payment existe en MercadoPago (esto valida que viene de MercadoPago)
        let paymentInfo;
        try {
          paymentInfo = await mercadopagoService.getPaymentInfo(paymentId);
        } catch (error) {
          logger.error(`Error al obtener información del pago ${paymentId} desde MercadoPago:`, error);
          // Si no podemos obtener el payment desde MercadoPago, rechazamos el webhook
          return { received: true, error: 'Payment not found in MercadoPago' };
        }

        if (!paymentInfo || !paymentInfo.external_reference) {
          logger.warn(`Webhook de pago ${paymentId} sin external_reference válido`);
          return { received: true, error: 'Invalid payment reference' };
        }
          const consultationId = paymentInfo.external_reference;
          const status = paymentInfo.status;

          logger.info(`Procesando webhook pago ${paymentId} para consulta ${consultationId}. Estado: ${status}`);

          // Buscar el pago en nuestra BD usando consultationId (ya que external_reference es consultationId)
          const localPayment = await prisma.payment.findUnique({
            where: { consultationId },
          });

          if (localPayment) {
            let newStatus = localPayment.status;

            if (status === 'approved') {
              newStatus = 'PAID';
            } else if (status === 'rejected' || status === 'cancelled') {
              newStatus = 'FAILED';
            }

            // Actualizar pago
            await prisma.payment.update({
              where: { id: localPayment.id },
              data: {
                status: newStatus,
                mercadopagoPaymentId: paymentId.toString(),
                paidAt: status === 'approved' ? new Date() : localPayment.paidAt,
              },
            });

            // Si se aprobó, activar la consulta y manejar payout según modalidad del médico
            if (status === 'approved' && localPayment.status !== 'PAID') {
              // Obtener la consulta con el médico
              const consultation = await prisma.consultation.findUnique({
                where: { id: consultationId },
                include: {
                  doctor: true,
                },
              });

              if (consultation) {
                // Determinar payoutStatus según la modalidad del médico
                let payoutStatus = 'PENDING';
                let payoutDate = null;

                if (consultation.doctor.payoutMode === 'IMMEDIATE') {
                  // Pago inmediato: marcar como liquidado
                  payoutStatus = 'PAID_OUT';
                  payoutDate = new Date();
                } else {
                  // Pago mensual: queda pendiente para liquidación
                  payoutStatus = 'PENDING';
                }

                // Actualizar el estado de payout
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
        }
      }

      } else {
        logger.info(`Webhook recibido de tipo desconocido: ${type}`);
      }

      return { received: true };
    } catch (error) {
      logger.error('Error al procesar webhook:', error);
      // IMPORTANTE: No lanzamos error para que MercadoPago no reintente infinitamente
      // si es un error lógico nuestro. Pero sí registramos el error para diagnóstico.
      // Si es un error crítico (BD, etc.), debería lanzarse para que MercadoPago reintente.
      const isCriticalError = error instanceof Error && 
        (error.message.includes('database') || error.message.includes('connection'));
      
      if (isCriticalError) {
        // Errores críticos: lanzamos para que MercadoPago reintente
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
