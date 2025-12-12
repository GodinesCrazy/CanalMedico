import prisma from '@/database/prisma';
import env from '@/config/env';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import consultationsService from '../consultations/consultations.service';
import mercadopagoService from './mercadopago.service';

export interface CreatePaymentSessionDto {
  consultationId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export class PaymentsService {
  async createPaymentSession(data: CreatePaymentSessionDto) {
    try {
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

      const amountValue = consultation.type === 'URGENCIA'
        ? Number(consultation.doctor.tarifaUrgencia)
        : Number(consultation.doctor.tarifaConsulta);

      if (amountValue <= 0) {
        throw createError('La tarifa no esta configurada', 400);
      }

      const fee = Math.round(amountValue * env.STRIPE_COMMISSION_FEE);
      const netAmount = amountValue - fee;

      const payerEmail = consultation.patient.user?.email || 'paciente@canalmedico.cl';

      const title = `Consulta medica - ${consultation.type === 'URGENCIA' ? 'Urgencia' : 'Normal'}`;
      const preference = await mercadopagoService.createPreference(
        consultation.id,
        title,
        amountValue,
        payerEmail,
        data.successUrl,
        data.cancelUrl
      );

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
      logger.error('Error al crear sesion de pago:', error);
      throw error;
    }
  }

  async handleWebhook(_signature: string, body: any) {
    try {
      const { type, data } = body;

      if (!type || !data || !data.id) {
        logger.warn('Webhook recibido con formato invalido:', body);
        return { received: true, error: 'Invalid webhook format' };
      }

      if (type === 'payment') {
        const paymentId = data.id;
        
        let paymentInfo;
        try {
          paymentInfo = await mercadopagoService.getPaymentInfo(paymentId);
        } catch (error) {
          logger.error(`Error al obtener informacion del pago ${paymentId} desde MercadoPago:`, error);
          return { received: true, error: 'Payment not found in MercadoPago' };
        }

        if (!paymentInfo || !paymentInfo.external_reference) {
          logger.warn(`Webhook de pago ${paymentId} sin external_reference valido`);
          return { received: true, error: 'Invalid payment reference' };
        }

        const consultationId = paymentInfo.external_reference;
        const status = paymentInfo.status;

        logger.info(`Procesando webhook pago ${paymentId} para consulta ${consultationId}. Estado: ${status}`);

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
