import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';

export class PayoutService {
    /**
     * Procesar liquidaciones mensuales para todos los médicos que corresponda
     */
    async processMonthlyPayouts() {
        try {
            const today = new Date();
            const currentDay = today.getDate();

            logger.info(`Procesando liquidaciones mensuales para el día ${currentDay}`);

            // Buscar médicos con pago mensual cuyo día de liquidación es hoy
            const doctors = await prisma.doctor.findMany({
                where: {
                    payoutMode: 'MONTHLY',
                    payoutDay: currentDay,
                }
            });

            logger.info(`Encontrados ${doctors.length} médicos para liquidar`);

            const results = [];
            for (const doctor of doctors) {
                const batch = await this.createPayoutBatch(doctor.id);
                if (batch) {
                    results.push(batch);
                }
            }

            logger.info(`Procesadas ${results.length} liquidaciones`);
            return results;
        } catch (error) {
            logger.error('Error al procesar liquidaciones mensuales:', error);
            throw error;
        }
    }

    /**
     * Crear lote de liquidación para un médico específico
     */
    async createPayoutBatch(doctorId: string) {
        try {
            const today = new Date();
            const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

            // Idempotencia: evitar duplicar batch del mismo periodo
            const existing = await prisma.payoutBatch.findFirst({
                where: { doctorId, period },
            });
            if (existing) {
                logger.info(`Batch ya existe para doctor ${doctorId} periodo ${period} (id ${existing.id})`);
                return null;
            }

            // Transacción: capturar pagos pendientes y marcarlos sin condiciones de carrera
            const result = await prisma.$transaction(async (tx) => {
                const pendingPayments = await tx.payment.findMany({
                    where: {
                        payoutStatus: 'PENDING',
                        payoutBatchId: null,
                        status: 'PAID',
                        consultation: { doctorId }
                    },
                    include: {
                        consultation: true
                    }
                });

                if (pendingPayments.length === 0) {
                    return null;
                }

                const totalAmount = pendingPayments.reduce(
                    (sum, p) => sum + Number(p.netAmount),
                    0
                );

                const batch = await tx.payoutBatch.create({
                    data: {
                        doctorId,
                        period,
                        totalAmount,
                        paymentCount: pendingPayments.length,
                        status: 'PROCESSED',
                        processedAt: new Date(),
                    }
                });

                await tx.payment.updateMany({
                    where: {
                        id: { in: pendingPayments.map(p => p.id) },
                        payoutBatchId: null,
                    },
                    data: {
                        payoutStatus: 'PAID_OUT',
                        payoutDate: new Date(),
                        payoutBatchId: batch.id,
                    }
                });

                return batch;
            });

            if (!result) {
                logger.info(`No hay pagos pendientes para el médico ${doctorId}`);
                return null;
            }

            logger.info(`Liquidación creada para médico ${doctorId}: periodo ${result.period}`);
            return result;
        } catch (error) {
            logger.error(`Error al crear liquidación para médico ${doctorId}:`, error);
            throw error;
        }
    }

    /**
     * Obtener liquidaciones de un médico
     */
    async getDoctorPayouts(doctorId: string, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;

            const [payouts, total] = await Promise.all([
                prisma.payoutBatch.findMany({
                    where: { doctorId },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.payoutBatch.count({
                    where: { doctorId }
                })
            ]);

            return {
                data: payouts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
            };
        } catch (error) {
            logger.error('Error al obtener liquidaciones:', error);
            throw error;
        }
    }

    /**
     * Obtener detalle de una liquidación específica
     */
    async getPayoutBatchDetail(batchId: string) {
        try {
            const batch = await prisma.payoutBatch.findUnique({
                where: { id: batchId },
                include: {
                    doctor: {
                        include: {
                            user: {
                                select: {
                                    email: true,
                                }
                            }
                        }
                    }
                }
            });

            if (!batch) {
                throw createError('Liquidación no encontrada', 404);
            }

            // Obtener los pagos incluidos en esta liquidación
            const payments = await prisma.payment.findMany({
                where: { payoutBatchId: batchId },
                include: {
                    consultation: {
                        include: {
                            patient: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { paidAt: 'desc' }
            });

            return {
                batch,
                payments,
            };
        } catch (error) {
            logger.error('Error al obtener detalle de liquidación:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de pagos para un médico
     */
    async getDoctorPayoutStats(doctorId: string) {
        try {
            // Total de ingresos generados (todos los pagos aprobados)
            const totalEarnings = await prisma.payment.aggregate({
                where: {
                    status: 'PAID',
                    consultation: {
                        doctorId
                    }
                },
                _sum: {
                    netAmount: true,
                }
            });

            // Saldo pendiente de liquidación
            const pendingAmount = await prisma.payment.aggregate({
                where: {
                    status: 'PAID',
                    payoutStatus: 'PENDING',
                    consultation: {
                        doctorId
                    }
                },
                _sum: {
                    netAmount: true,
                }
            });

            // Monto ya liquidado
            const paidOutAmount = await prisma.payment.aggregate({
                where: {
                    status: 'PAID',
                    payoutStatus: 'PAID_OUT',
                    consultation: {
                        doctorId
                    }
                },
                _sum: {
                    netAmount: true,
                }
            });

            // Cantidad de pagos por estado
            const paymentCounts = await prisma.payment.groupBy({
                by: ['payoutStatus'],
                where: {
                    status: 'PAID',
                    consultation: {
                        doctorId
                    }
                },
                _count: true,
            });

            return {
                totalEarnings: Number(totalEarnings._sum.netAmount || 0),
                pendingAmount: Number(pendingAmount._sum.netAmount || 0),
                paidOutAmount: Number(paidOutAmount._sum.netAmount || 0),
                paymentCounts: paymentCounts.reduce((acc, item) => {
                    acc[item.payoutStatus] = item._count;
                    return acc;
                }, {} as Record<string, number>),
            };
        } catch (error) {
            logger.error('Error al obtener estadísticas de pagos:', error);
            throw error;
        }
    }
}

export default new PayoutService();
