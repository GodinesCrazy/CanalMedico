import { Router, Request, Response } from 'express';
import prisma from '@/database/prisma';
import * as bcrypt from 'bcryptjs';
import logger from '@/config/logger';
import { execSync } from 'child_process';

const router = Router();

router.post('/', async (_req: Request, res: Response) => {
    try {
        logger.info('ðŸŒ± Iniciando seed de la base de datos...');
        const hashedPassword1 = await bcrypt.hash('doctor123', 10);
        const hashedPassword2 = await bcrypt.hash('admin123', 10);
        const hashedPassword3 = await bcrypt.hash('patient123', 10);
        const doctorUser = await prisma.user.upsert({
            where: { email: 'doctor1@ejemplo.com' },
            update: {},
            create: {
                email: 'doctor1@ejemplo.com',
                password: hashedPassword1,
                role: 'DOCTOR',
            },
        });
        await prisma.doctor.upsert({
            where: { userId: doctorUser.id },
            update: {},
            create: {
                userId: doctorUser.id,
                name: 'Dr. Juan PÃ©rez',
                rut: '12345678-9',
                speciality: 'Medicina General',
                tarifaConsulta: 15000,
                tarifaUrgencia: 25000,
                estadoOnline: false,
            },
        });
        logger.info('âœ… Doctor creado');
        await prisma.user.upsert({
            where: { email: 'admin@canalmedico.com' },
            update: {},
            create: {
                email: 'admin@canalmedico.com',
                password: hashedPassword2,
                role: 'ADMIN',
            },
        });
        logger.info('âœ… Admin creado');
        const patientUser = await prisma.user.upsert({
            where: { email: 'paciente1@ejemplo.com' },
            update: {},
            create: {
                email: 'paciente1@ejemplo.com',
                password: hashedPassword3,
                role: 'PATIENT',
            },
        });
        await prisma.patient.upsert({
            where: { userId: patientUser.id },
            update: {},
            create: {
                userId: patientUser.id,
                name: 'MarÃ­a GonzÃ¡lez',
                age: 30,
            },
        });
        logger.info('âœ… Paciente creado');
        logger.info('ðŸŽ‰ Seed completado exitosamente!');
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

router.post('/migrate', async (_req: Request, res: Response) => {
    try {
        logger.info('ðŸ”„ Ejecutando migraciÃ³n manual...');
        const output = execSync('npx prisma db push --accept-data-loss', {
            encoding: 'utf-8',
            env: process.env
        });
        logger.info('âœ… MigraciÃ³n manual completada');
        res.json({
            success: true,
            message: 'MigraciÃ³n ejecutada exitosamente',
            output: output
        });
    } catch (error: any) {
        logger.error('âŒ Error en migraciÃ³n manual:', error);
        res.status(500).json({
            success: false,
            error: 'Error al ejecutar migraciÃ³n',
            details: error.message,
            output: error.stdout ? error.stdout.toString() : '',
            stderr: error.stderr ? error.stderr.toString() : ''
        });
    }
});

/**
 * @swagger
 * /api/seed/migrate-validation:
 *   post:
 *     tags:
 *       - Seed
 *     summary: Ejecutar migraciÃ³n SQL de validaciÃ³n de doctores
 *     description: Ejecuta el SQL para agregar columnas de validaciÃ³n a la tabla doctors
 */
router.post('/migrate-validation', async (_req: Request, res: Response) => {
    try {
        logger.info('ðŸ”„ Ejecutando migraciÃ³n SQL de validaciÃ³n de doctores...');

        // Ejecutar ALTER TABLE (todas las columnas en una sola sentencia)
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "doctors" 
            ADD COLUMN IF NOT EXISTS "identidadValidada" BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS "profesionValidada" BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS "rnpiEstado" TEXT,
            ADD COLUMN IF NOT EXISTS "rnpiProfesion" TEXT,
            ADD COLUMN IF NOT EXISTS "rnpiFechaVerificacion" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "verificacionEstadoFinal" TEXT DEFAULT 'PENDIENTE',
            ADD COLUMN IF NOT EXISTS "logsValidacion" TEXT,
            ADD COLUMN IF NOT EXISTS "identityVerificationData" TEXT,
            ADD COLUMN IF NOT EXISTS "rnpiVerificationData" TEXT,
            ADD COLUMN IF NOT EXISTS "lastVerificationAt" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "verificationErrors" TEXT
        `);

        // Ejecutar CREATE INDEX uno por uno
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "doctors_verificacionEstadoFinal_idx" ON "doctors"("verificacionEstadoFinal")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "doctors_identidadValidada_idx" ON "doctors"("identidadValidada")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "doctors_profesionValidada_idx" ON "doctors"("profesionValidada")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "doctors_rut_idx" ON "doctors"("rut")`);

        // Verificar que las columnas fueron creadas
        const columns = await prisma.$queryRawUnsafe(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'doctors'
            AND column_name IN (
                'identidadValidada',
                'profesionValidada',
                'rnpiEstado',
                'rnpiProfesion',
                'rnpiFechaVerificacion',
                'verificacionEstadoFinal',
                'logsValidacion',
                'identityVerificationData',
                'rnpiVerificationData',
                'lastVerificationAt',
                'verificationErrors'
            )
            ORDER BY column_name
        `);

        logger.info('âœ… MigraciÃ³n SQL de validaciÃ³n completada');

        res.json({
            success: true,
            message: 'MigraciÃ³n de validaciÃ³n ejecutada exitosamente',
            columns: columns
        });
    } catch (error: any) {
        logger.error('âŒ Error en migraciÃ³n SQL de validaciÃ³n:', error);
        res.status(500).json({
            success: false,
            error: 'Error al ejecutar migraciÃ³n SQL',
            details: error.message
        });
    }
});



/**
 * @swagger
 * /api/seed/verify-validation:
 *   get:
 *     tags:
 *       - Seed
 *     summary: Verificar estado de migraciÃ³n de validaciÃ³n
 *     description: Verifica si las columnas de validaciÃ³n fueron creadas correctamente en la tabla doctors
 */
router.get('/verify-validation', async (_req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
        logger.info('[verify-validation] Iniciando verificaciÃ³n de columnas...');
        
        let columns = [];
        try {
            logger.info('[verify-validation] Ejecutando query SQL...');
            const result = await prisma.$queryRawUnsafe(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'doctors'
                AND column_name IN (
                    'identidadValidada',
                    'profesionValidada',
                    'rnpiEstado',
                    'rnpiProfesion',
                    'rnpiFechaVerificacion',
                    'verificacionEstadoFinal',
                    'logsValidacion',
                    'identityVerificationData',
                    'rnpiVerificationData',
                    'lastVerificationAt',
                    'verificationErrors'
                )
                ORDER BY column_name
            `);
            columns = result;
            logger.info(`[verify-validation] Query ejecutado: ${columns.length} columnas encontradas`);
        } catch (queryError) {
            logger.error('[verify-validation] Error en query SQL:', queryError);
            if (!res.headersSent) {
                return res.status(500).json({
                    success: false,
                    error: 'Error al ejecutar query SQL',
                    details: queryError.message,
                    timestamp: new Date().toISOString()
                });
            }
            return;
        }

        const expectedColumns = [
            'identidadValidada',
            'profesionValidada',
            'rnpiEstado',
            'rnpiProfesion',
            'rnpiFechaVerificacion',
            'verificacionEstadoFinal',
            'logsValidacion',
            'identityVerificationData',
            'rnpiVerificationData',
            'lastVerificationAt',
            'verificationErrors'
        ];

        const foundColumnNames = Array.isArray(columns) ? columns.map((c) => c.column_name) : [];
        const missingColumns = expectedColumns.filter(col => !foundColumnNames.includes(col));

        logger.info(`[verify-validation] Columnas encontradas: ${foundColumnNames.length}/${expectedColumns.length}`);
        if (missingColumns.length > 0) {
            logger.warn(`[verify-validation] Columnas faltantes: ${missingColumns.join(', ')}`);
        }

        const duration = Date.now() - startTime;
        logger.info(`[verify-validation] VerificaciÃ³n completada en ${duration}ms`);

        if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({
                success: true,
                message: 'VerificaciÃ³n completada',
                totalExpected: expectedColumns.length,
                totalFound: foundColumnNames.length,
                columns: columns,
                missingColumns: missingColumns,
                allColumnsPresent: missingColumns.length === 0,
                timestamp: new Date().toISOString(),
                duration: `${duration}ms`
            });
        }
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('[verify-validation] Error general:', error);
        
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json({
                success: false,
                error: 'Error al verificar columnas',
                details: error.message,
                timestamp: new Date().toISOString(),
                duration: `${duration}ms`
            });
        }
    }
});

export default router;

