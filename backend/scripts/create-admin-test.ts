/**
 * Script para crear/actualizar usuario ADMIN de pruebas
 * 
 * Este script crea o actualiza el usuario admin@canalmedico.test
 * con contraseña Admin123! para pruebas en producción.
 * 
 * Ejecutar en Railway:
 * npx tsx scripts/create-admin-test.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminTest() {
    console.log('🔐 Creando/actualizando usuario ADMIN de pruebas...');

    try {
        // Hashear contraseña
        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        // Crear o actualizar usuario ADMIN
        const adminUser = await prisma.user.upsert({
            where: { email: 'admin@canalmedico.test' },
            update: {
                password: hashedPassword,
                role: 'ADMIN', // Asegurar que el rol sea ADMIN
            },
            create: {
                email: 'admin@canalmedico.test',
                password: hashedPassword,
                role: 'ADMIN',
            },
        });

        console.log('✅ Usuario ADMIN de pruebas creado/actualizado exitosamente!');
        console.log('\n📋 Credenciales:');
        console.log('   Email: admin@canalmedico.test');
        console.log('   Password: Admin123!');
        console.log('   Rol: ADMIN');
        console.log(`   ID: ${adminUser.id}`);
        console.log('\n🌐 Puedes iniciar sesión en:');
        console.log('   https://canalmedico-web-production.up.railway.app/login');

    } catch (error) {
        console.error('❌ Error al crear usuario ADMIN:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createAdminTest()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

