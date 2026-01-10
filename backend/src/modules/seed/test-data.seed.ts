/**
 * Test Data Seed - Usuarios de Prueba para E2E
 * 
 * SOLO se ejecuta si ENABLE_TEST_DATA === 'true'
 * NO se ejecuta en producción a menos que esté explícitamente habilitado
 * 
 * Crea usuarios idempotentes para pruebas E2E:
 * - ADMIN: admin@canalmedico.com (si no existe, o resetea si ENABLE_TEST_ADMIN=true)
 * - DOCTOR: doctor.test@canalmedico.com
 * - PATIENT: patient.test@canalmedico.com
 */

import prisma from '@/database/prisma';
import { hashPassword } from '@/utils/hash';
import logger from '@/config/logger';

const ENABLE_TEST_DATA = process.env.ENABLE_TEST_DATA === 'true';

// Credenciales de prueba (documentadas en docs/CREDENCIALES_TEST_FASE_2_2.md)
export const TEST_CREDENTIALS = {
  ADMIN: {
    email: 'admin@canalmedico.com',
    password: 'Admin123!',
    role: 'ADMIN',
  },
  DOCTOR: {
    email: 'doctor.test@canalmedico.com',
    password: 'DoctorTest123!',
    role: 'DOCTOR',
    name: 'Dr. Test User',
    speciality: 'Medicina General',
    tarifaConsulta: 15000,
    tarifaUrgencia: 25000,
  },
  PATIENT: {
    email: 'patient.test@canalmedico.com',
    password: 'PatientTest123!',
    role: 'PATIENT',
    name: 'Paciente Test User',
    age: 30,
  },
};

/**
 * Crea usuarios de prueba para E2E
 * 
 * SOLO se ejecuta si ENABLE_TEST_DATA === 'true'
 */
export async function createTestUsers(): Promise<{ doctorId?: string; patientId?: string; adminId?: string } | null> {
  if (!ENABLE_TEST_DATA) {
    logger.debug('[TEST-DATA] Seed de datos de prueba deshabilitado (ENABLE_TEST_DATA !== true)');
    return null;
  }

  logger.info('[TEST-DATA] ========================================');
  logger.info('[TEST-DATA] Creando usuarios de prueba para E2E');
  logger.info('[TEST-DATA] ENABLE_TEST_DATA=true');
  logger.info('[TEST-DATA] ========================================');

  try {
    const result: { doctorId?: string; patientId?: string; adminId?: string } = {};

    // ADMIN: Verificar si existe (puede ser creado por bootstrap)
    const adminUser = await prisma.user.findUnique({
      where: { email: TEST_CREDENTIALS.ADMIN.email },
      select: { id: true, role: true },
    });

    if (adminUser) {
      logger.info(`[TEST-DATA] Admin encontrado: ${TEST_CREDENTIALS.ADMIN.email} (ID: ${adminUser.id})`);
      result.adminId = adminUser.id;
    } else {
      logger.info(`[TEST-DATA] Admin no encontrado. Será creado por bootstrap si ENABLE_TEST_ADMIN=true`);
    }

    // DOCTOR: Crear o actualizar
    logger.info(`[TEST-DATA] Creando/actualizando DOCTOR: ${TEST_CREDENTIALS.DOCTOR.email}...`);
    const hashedDoctorPassword = await hashPassword(TEST_CREDENTIALS.DOCTOR.password);
    const doctorUser = await prisma.user.upsert({
      where: { email: TEST_CREDENTIALS.DOCTOR.email },
      update: {
        password: hashedDoctorPassword, // Resetear password en cada seed
        role: 'DOCTOR',
      },
      create: {
        email: TEST_CREDENTIALS.DOCTOR.email,
        password: hashedDoctorPassword,
        role: 'DOCTOR',
      },
      select: { id: true },
    });

    const doctor = await prisma.doctor.upsert({
      where: { userId: doctorUser.id },
      update: {
        name: TEST_CREDENTIALS.DOCTOR.name,
        speciality: TEST_CREDENTIALS.DOCTOR.speciality,
        tarifaConsulta: TEST_CREDENTIALS.DOCTOR.tarifaConsulta,
        tarifaUrgencia: TEST_CREDENTIALS.DOCTOR.tarifaUrgencia,
      },
      create: {
        userId: doctorUser.id,
        name: TEST_CREDENTIALS.DOCTOR.name,
        speciality: TEST_CREDENTIALS.DOCTOR.speciality,
        tarifaConsulta: TEST_CREDENTIALS.DOCTOR.tarifaConsulta,
        tarifaUrgencia: TEST_CREDENTIALS.DOCTOR.tarifaUrgencia,
        estadoOnline: false,
      },
      select: { id: true },
    });

    result.doctorId = doctor.id;
    logger.info(`[TEST-DATA] ✅ Doctor creado/actualizado: ${TEST_CREDENTIALS.DOCTOR.email} (Doctor ID: ${doctor.id})`);

    // PATIENT: Crear o actualizar
    logger.info(`[TEST-DATA] Creando/actualizando PATIENT: ${TEST_CREDENTIALS.PATIENT.email}...`);
    const hashedPatientPassword = await hashPassword(TEST_CREDENTIALS.PATIENT.password);
    const patientUser = await prisma.user.upsert({
      where: { email: TEST_CREDENTIALS.PATIENT.email },
      update: {
        password: hashedPatientPassword, // Resetear password en cada seed
        role: 'PATIENT',
      },
      create: {
        email: TEST_CREDENTIALS.PATIENT.email,
        password: hashedPatientPassword,
        role: 'PATIENT',
      },
      select: { id: true },
    });

    const patient = await prisma.patient.upsert({
      where: { userId: patientUser.id },
      update: {
        name: TEST_CREDENTIALS.PATIENT.name,
        age: TEST_CREDENTIALS.PATIENT.age,
      },
      create: {
        userId: patientUser.id,
        name: TEST_CREDENTIALS.PATIENT.name,
        age: TEST_CREDENTIALS.PATIENT.age,
      },
      select: { id: true },
    });

    result.patientId = patient.id;
    logger.info(`[TEST-DATA] ✅ Patient creado/actualizado: ${TEST_CREDENTIALS.PATIENT.email} (Patient ID: ${patient.id})`);

    logger.info('[TEST-DATA] ✅ Usuarios de prueba creados/actualizados correctamente');
    logger.info('[TEST-DATA] ========================================');

    return result;
  } catch (error: any) {
    logger.error('[TEST-DATA] ❌ Error al crear usuarios de prueba:', error.message || error);
    throw error;
  }
}

