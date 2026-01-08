import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Iniciando seed de la base de datos...');

    // Hashear passwords
    const hashedPassword1 = await bcrypt.hash('doctor123', 10);
    const hashedPassword2 = await bcrypt.hash('admin123', 10);
    const hashedPassword3 = await bcrypt.hash('patient123', 10);

    try {
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
        console.log('✅ Doctor creado: doctor1@ejemplo.com / doctor123');

        // 2. Crear usuario Admin (admin@canalmedico.com)
        const adminUser = await prisma.user.upsert({
            where: { email: 'admin@canalmedico.com' },
            update: {},
            create: {
                email: 'admin@canalmedico.com',
                password: hashedPassword2,
                role: 'ADMIN',
            },
        });
        console.log('✅ Admin creado: admin@canalmedico.com / admin123');

        // 3. Crear o actualizar usuario Admin para pruebas (admin@canalmedico.test)
        const hashedPasswordTest = await bcrypt.hash('Admin123!', 10);
        const adminTestUser = await prisma.user.upsert({
            where: { email: 'admin@canalmedico.test' },
            update: {
                password: hashedPasswordTest,
                role: 'ADMIN', // Asegurar que el rol sea ADMIN
            },
            create: {
                email: 'admin@canalmedico.test',
                password: hashedPasswordTest,
                role: 'ADMIN',
            },
        });
        console.log('✅ Admin de pruebas creado/actualizado: admin@canalmedico.test / Admin123!');

        // 4. Crear usuario Paciente
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
        console.log('✅ Paciente creado: paciente1@ejemplo.com / patient123');

        console.log('🎉 Seed completado exitosamente!');
        console.log('\nCredenciales de prueba:');
        console.log('------------------------');
        console.log('Doctor:   doctor1@ejemplo.com / doctor123');
        console.log('Admin:    admin@canalmedico.com / admin123');
        console.log('Admin (Test): admin@canalmedico.test / Admin123!');
        console.log('Paciente: paciente1@ejemplo.com / patient123');
    } catch (error) {
        console.error('Error durante el seed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
