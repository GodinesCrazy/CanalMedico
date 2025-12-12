import { Router, Request, Response } from 'express';
import prisma from '@/database/prisma';
import * as bcrypt from 'bcryptjs';
import logger from '@/config/logger';

const router = Router();

/**
 * @swagger
 * /api/seed:
 *   post:
 *     tags:
 *       - Seed
 *     summary: Poblar base de datos con usuarios de prueba
 *     description: SOLO PARA DESARROLLO - Crea usuarios de prueba en la base de datos
 */
router.post('/', async (_req: Request, res: Response) => {
    try {
        logger.info('🌱 Iniciando seed de la base de datos...');

        // Hashear passwords
        const hashedPassword1 = await bcrypt.hash('doctor123', 10);
        const hashedPassword2 = await bcrypt.hash('admin123', 10);
        const hashedPassword3 = await bcrypt.hash('patient123', 10);

        // 1. Crear usuario Doctor
        const doctorUser = await prisma.user.upsert({
            where: { email: 'doctor1@ejemplo.com' },
            update: {},
            create: {
                email: 'doctor1@ejemplo.com',
                password: hashedPassword1,
                role: 'DOCTOR',
            },
        });

        // Crear perfil de Doctor
        await prisma.doctor.upsert({
            where: { userId: doctorUser.id },
            update: {},
            create: {
                userId: doctorUser.id,
                name: 'Dr. Juan Pérez',
                rut: '12345678-9',
                speciality: 'Medicina General',
                tarifaConsulta: 15000,
                tarifaUrgencia: 25000,
                estadoOnline: false,
            },
        });
        logger.info('✅ Doctor creado');

        // 2. Crear usuario Admin
        await prisma.user.upsert({
            where: { email: 'admin@canalmedico.com' },
            update: {},
            create: {
                email: 'admin@canalmedico.com',
                password: hashedPassword2,
                role: 'ADMIN',
            },
        });
        logger.info('✅ Admin creado');

        // 3. Crear usuario Paciente
        const patientUser = await prisma.user.upsert({
            where: { email: 'paciente1@ejemplo.com' },
            update: {},
            create: {
                email: 'paciente1@ejemplo.com',
                password: hashedPassword3,
                role: 'PATIENT',
            },
        });

        // Crear perfil de Paciente
        await prisma.patient.upsert({
            where: { userId: patientUser.id },
            update: {},
            create: {
                userId: patientUser.id,
                name: 'María González',
                age: 30,
            },
        });
        logger.info('✅ Paciente creado');

        logger.info('🎉 Seed completado exitosamente!');

        res.json({
            success: true,
            message: 'Base de datos poblada exitosamente',
            users: [
                { email: 'doctor1@ejemplo.com', password: 'doctor123', role: 'DOCTOR' },
                { email: 'admin@canalmedico.com', password: 'admin123', role: 'ADMIN' },
                { email: 'paciente1@ejemplo.com', password: 'patient123', role: 'PATIENT' },
            ],
        });
    } catch (error: any) {
        logger.error('Error durante el seed:', error);
        res.status(500).json({
            success: false,
            error: 'Error al poblar la base de datos',
            details: error.message,
        });
    }
});

import { execSync } from 'child_process';

/**
 * @swagger
 * /api/seed/migrate:
 *   post:
 *     tags:
 *       - Seed
 *     summary: Ejecutar migraciones de base de datos
 *     description: Ejecuta Prisma db push para aplicar cambios del schema a la base de datos. Crea los campos y tablas nuevos definidos en schema.prisma
 *     responses:
 *       200:
 *         description: Migración ejecutada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Migración ejecutada exitosamente"
 *                 output:
 *                   type: string
 *                   description: "Salida del comando Prisma"
 *       500:
 *         description: Error al ejecutar migración
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 *                 output:
 *                   type: string
 *                 stderr:
 *                   type: string
 */
router.post('/migrate', async (_req: Request, res: Response) => {
    try {
        logger.info('🔄 Ejecutando migración manual...');

        const output = execSync('npx prisma db push --accept-data-loss', {
            encoding: 'utf-8',
            env: process.env
        });

        logger.info('✅ Migración manual completada');

        res.json({
            success: true,
            message: 'Migración ejecutada exitosamente',
            output: output
        });
    } catch (error: any) {
        logger.error('❌ Error en migración manual:', error);
        res.status(500).json({
            success: false,
            error: 'Error al ejecutar migración',
            details: error.message,
            output: error.stdout ? error.stdout.toString() : '',
            stderr: error.stderr ? error.stderr.toString() : ''
        });
    }
});

export default router;
