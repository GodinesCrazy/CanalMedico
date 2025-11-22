import prisma from '@/database/prisma';
import logger from '@/config/logger';

export class CommissionsService {
    /**
     * Obtener estadísticas generales de comisiones
     */
    async getCommissionsStats() {
        try {
            // Total de comisiones generadas
            const totalCommissions = await prisma.payment.aggregate({
                where: {
                    status: 'PAID',
                },
                _sum: {
                    fee: true,
                },
            });

            // Comisiones del mes actual
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const monthlyCommissions = await prisma.payment.aggregate({
                where: {
                    status: 'PAID',
                    paidAt: {
                        gte: startOfMonth,
                    },
                },
                _sum: {
                    fee: true,
                },
            });

            // Cantidad de pagos
            const paymentsCount = await prisma.payment.count({
                where: {
                    status: 'PAID',
                },
            });

            return {
                totalCommissions: Number(totalCommissions._sum.fee || 0),
                monthlyCommissions: Number(monthlyCommissions._sum.fee || 0),
                paymentsCount,
            };
        } catch (error) {
            logger.error('Error al obtener estadísticas de comisiones:', error);
            throw error;
        }
    }

    /**
     * Obtener comisiones por período
     */
    async getCommissionsByPeriod(startDate: Date, endDate: Date) {
        try {
            const payments = await prisma.payment.findMany({
                where: {
                    status: 'PAID',
                    paidAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                include: {
                    consultation: {
                        include: {
                            doctor: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                            patient: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    paidAt: 'desc',
                },
            });

            const totalFee = payments.reduce((sum, p) => sum + Number(p.fee), 0);
            const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

            return {
                payments,
                summary: {
                    totalPayments: payments.length,
                    totalAmount,
                    totalFee,
                    averageFee: payments.length > 0 ? totalFee / payments.length : 0,
                },
            };
        } catch (error) {
            logger.error('Error al obtener comisiones por período:', error);
            throw error;
        }
    }

    /**
     * Obtener comisiones por médico
     */
    async getCommissionsByDoctor(startDate?: Date, endDate?: Date) {
        try {
            const whereClause: any = {
                status: 'PAID',
            };

            if (startDate && endDate) {
                whereClause.paidAt = {
                    gte: startDate,
                    lte: endDate,
                };
            }

            const payments = await prisma.payment.findMany({
                where: whereClause,
                include: {
                    consultation: {
                        include: {
                            doctor: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                            throw error;
                        }
                    }

    /**
     * Obtener detalle de comisiones de un médico específico
     */
    async getDoctorCommissionsDetail(doctorId: string, startDate?: Date, endDate?: Date) {
                        try {
                            const whereClause: any = {
                                status: 'PAID',
                                consultation: {
                                    doctorId,
                                },
                            };

                            if (startDate && endDate) {
                                whereClause.paidAt = {
                                    gte: startDate,
                                    lte: endDate,
                                };
                            }

                            const payments = await prisma.payment.findMany({
                                where: whereClause,
                                include: {
                                    consultation: {
                                        include: {
                                            patient: {
                                                include: {
                                                    user: {
                                                        select: {
                                                            email: true,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                orderBy: {
                                    paidAt: 'desc',
                                },
                            });

                            const totalFee = payments.reduce((sum, p) => sum + Number(p.fee), 0);
                            const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
                            const totalNet = payments.reduce((sum, p) => sum + Number(p.netAmount), 0);

                            return {
                                payments,
                                summary: {
                                    totalPayments: payments.length,
                                    totalAmount,
                                    totalFee,
                                    totalNet,
                                },
                            };
                        } catch (error) {
                            logger.error('Error al obtener detalle de comisiones del médico:', error);
                            throw error;
                        }
                    }

    /**
     * Obtener comisiones mensuales (últimos 12 meses)
     */
    async getMonthlyCommissions() {
                        try {
                            const now = new Date();
                            const twelveMonthsAgo = new Date();
                            twelveMonthsAgo.setMonth(now.getMonth() - 12);

                            const payments = await prisma.payment.findMany({
                                where: {
                                    status: 'PAID',
                                    paidAt: {
                                        gte: twelveMonthsAgo,
                                    },
                                },
                                select: {
                                    fee: true,
                                    amount: true,
                                    paidAt: true,
                                },
                            });

                            // Agrupar por mes
                            const monthlyData = payments.reduce((acc, payment) => {
                                if (!payment.paidAt) return acc;

                                const month = payment.paidAt.toISOString().substring(0, 7); // YYYY-MM

                                if (!acc[month]) {
                                    acc[month] = {
                                        month,
                                        totalCommissions: 0,
                                        totalAmount: 0,
                                        paymentsCount: 0,
                                    };
                                }

                                acc[month].totalCommissions += Number(payment.fee);
                                acc[month].totalAmount += Number(payment.amount);
                                acc[month].paymentsCount += 1;

                                return acc;
                            }, {} as Record<string, any>);

                            return Object.values(monthlyData).sort((a: any, b: any) =>
                                a.month.localeCompare(b.month)
                            );
                        } catch (error) {
                            logger.error('Error al obtener comisiones mensuales:', error);
                            throw error;
                        }
                    }
                }

export default new CommissionsService();
