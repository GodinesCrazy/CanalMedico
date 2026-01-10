/**
 * Test Setup Helpers
 * Utilidades para configurar y ejecutar tests de integración
 */

import { PrismaClient } from '@prisma/client';
import { generateTokenPair } from '@/utils/jwt';
import { hashPassword } from '@/utils/hash';

const prisma = new PrismaClient();

/**
 * Limpiar base de datos antes de cada test
 */
export async function cleanDatabase() {
  // Orden de eliminación respetando foreign keys
  await prisma.message.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Crear usuario de prueba con perfil
 */
export async function createTestUser(data: {
  email: string;
  password: string;
  role: 'ADMIN' | 'DOCTOR' | 'PATIENT';
  name: string;
  speciality?: string;
  age?: number;
}) {
  const hashedPassword = await hashPassword(data.password);
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: data.role,
      ...(data.role === 'DOCTOR' && {
        doctor: {
          create: {
            name: data.name,
            speciality: data.speciality || 'Medicina General',
            tarifaConsulta: 10000,
            tarifaUrgencia: 20000,
            estadoOnline: false,
          },
        },
      }),
      ...(data.role === 'PATIENT' && {
        patient: {
          create: {
            name: data.name,
            age: data.age || 30,
          },
        },
      }),
    },
    include: {
      doctor: true,
      patient: true,
    },
  });

  return user;
}

/**
 * Generar tokens JWT para un usuario
 */
export function generateTestTokens(userId: string, email: string, role: string) {
  return generateTokenPair(userId, email, role as any);
}

/**
 * Crear consulta de prueba
 */
export async function createTestConsultation(data: {
  doctorId: string;
  patientId: string;
  type: 'NORMAL' | 'URGENCIA';
  status?: 'PENDING' | 'PAID' | 'ACTIVE' | 'CLOSED';
}) {
  const consultation = await prisma.consultation.create({
    data: {
      doctorId: data.doctorId,
      patientId: data.patientId,
      type: data.type,
      status: data.status || 'PENDING',
    },
    include: {
      doctor: true,
      patient: true,
    },
  });

  return consultation;
}

/**
 * Obtener instancia de Prisma para tests
 */
export function getPrismaClient() {
  return prisma;
}

