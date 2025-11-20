import Stripe from 'stripe';
import prisma from '@/database/prisma';
import env from '@/config/env';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import { PaymentStatus } from '@prisma/client';
import consultationsService from '../consultations/consultations.service';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

export interface CreatePaymentSessionDto {
  consultationId: string;
  successUrl: string;
  cancelUrl: string;
}

export class PaymentsService {
  async createPaymentSession(data: CreatePaymentSessionDto) {
    try {
      // Obtener consulta
      const consultation = await prisma.consultation.findUnique({
        where: { id: data.consultationId },
        include: {
          doctor: true,
          patient: true,
        },
      });

      if (!consultation) {
        throw createError('Consulta no encontrada', 404);
      }

      if (consultation.status !== 'PENDING') {
        throw createError('La consulta ya tiene un pago procesado', 400);
      }

      // Calcular monto según tipo de consulta
      const amount = consultation.type === 'URGENCIA' 
        ? consultation.doctor.tarifaUrgencia 
        : consultation.doctor.tarifaConsulta;

      if (amount <= 0) {
        throw createError('La tarifa no está configurada', 400);
      }

      // Calcular fee y monto neto
      const fee = amount * env.STRIPE_COMMISSION_FEE;
      const netAmount = amount - fee;

      // Crear sesión de pago en Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Consulta médica - ${consultation.type === 'URGENCIA' ? 'Urgencia' : 'Normal'}`,
                description: `Consulta con Dr. ${consultation.doctor.name}`,
              },
              unit_amount: Math.round(amount * 100), // Stripe usa centavos
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: {
          consultationId: consultation.id,
          doctorId: consultation.doctorId,
          patientId: consultation.patientId,
          type: consultation.type,
        },
      });

      // Crear registro de pago
      const payment = await prisma.payment.create({
        data: {
          amount,
          fee,
          netAmount,
          status: PaymentStatus.PENDING,
          stripeSessionId: session.id,
          consultationId: consultation.id,
        },
      });

      logger.info(`Sesión de pago creada: ${session.id} - Consulta: ${consultation.id}`);

      return {
        sessionId: session.id,
        url: session.url,
        payment,
      };
    } catch (error) {
      logger.error('Error al crear sesión de pago:', error);
      throw error;
    }
  }

  async handleWebhook(signature: string, body: string) {
    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET || ''
      );

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handlePaymentSuccess(event.data.object as Stripe.Checkout.Session);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        default:
          logger.info(`Evento no manejado: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      logger.error('Error al procesar webhook:', error);
      throw createError('Error al procesar webhook', 400);
    }
  }

  private async handlePaymentSuccess(session: Stripe.Checkout.Session) {
    try {
      const consultationId = session.metadata?.consultationId;

      if (!consultationId) {
        throw new Error('Consultation ID no encontrado en metadata');
      }

      // Actualizar pago
      const payment = await prisma.payment.update({
        where: { stripeSessionId: session.id },
        data: {
          status: PaymentStatus.PAID,
          stripePaymentId: session.payment_intent as string,
          paidAt: new Date(),
        },
      });

      // Activar consulta
      await consultationsService.activate(consultationId, payment.id);

      logger.info(`Pago exitoso: ${session.id} - Consulta activada: ${consultationId}`);
    } catch (error) {
      logger.error('Error al procesar pago exitoso:', error);
      throw error;
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      // Buscar pago por sessionId o paymentIntentId
      const payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { stripePaymentId: paymentIntent.id },
            { stripeSessionId: paymentIntent.id },
          ],
        },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
          },
        });

        logger.info(`Pago fallido: ${paymentIntent.id}`);
      }
    } catch (error) {
      logger.error('Error al procesar pago fallido:', error);
      throw error;
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

