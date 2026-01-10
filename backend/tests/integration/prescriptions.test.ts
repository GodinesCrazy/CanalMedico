/**
 * Tests de Integración - Recetas SNRE
 * Flujo crítico: Crear receta, obtener receta, validación de propiedad (IDOR)
 * 
 * Tests obligatorios para GO a producción:
 * 1. Crear receta exitosa (201) - Mockeado SNRE
 * 2. Obtener receta de consulta propia (200)
 * 3. Acceso a receta de consulta ajena bloqueado (403)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { cleanDatabase, createTestUser, generateTestTokens, createTestConsultation } from '../helpers/test-setup';
import { authenticatedRequest, unauthenticatedRequest } from '../helpers/test-server';

// Mock de SNRE Service
jest.mock('@/modules/snre/snre.service', () => ({
  default: {
    createPrescription: jest.fn().mockResolvedValue({
      id: 'test-prescription-id',
      consultationId: 'test-consultation-id',
      snreId: 'test-snre-id',
    }),
    getPrescriptionById: jest.fn(),
    getPrescriptionsByConsultation: jest.fn(),
  },
}));

describe('Recetas SNRE - Flujo Crítico', () => {
  let doctorUser: any;
  let patientUser: any;
  let otherPatientUser: any;
  let doctorToken: string;
  let patientToken: string;
  let otherPatientToken: string;
  let consultation: any;

  beforeAll(async () => {
    await cleanDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Crear usuarios de prueba
    doctorUser = await createTestUser({
      email: 'doctor@example.com',
      password: 'password123',
      role: 'DOCTOR',
      name: 'Doctor Test',
      speciality: 'Medicina General',
    });

    patientUser = await createTestUser({
      email: 'patient@example.com',
      password: 'password123',
      role: 'PATIENT',
      name: 'Patient Test',
    });

    otherPatientUser = await createTestUser({
      email: 'otherpatient@example.com',
      password: 'password123',
      role: 'PATIENT',
      name: 'Other Patient Test',
    });

    // Generar tokens
    doctorToken = generateTestTokens(doctorUser.id, doctorUser.email, doctorUser.role).accessToken;
    patientToken = generateTestTokens(patientUser.id, patientUser.email, patientUser.role).accessToken;
    otherPatientToken = generateTestTokens(otherPatientUser.id, otherPatientUser.email, otherPatientUser.role).accessToken;

    // Crear consulta
    consultation = await createTestConsultation({
      doctorId: doctorUser.doctor!.id,
      patientId: patientUser.patient!.id,
      type: 'NORMAL',
      status: 'ACTIVE',
    });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/prescriptions', () => {
    it('✅ Test feliz: Crear receta exitosa (201)', async () => {
      const response = await authenticatedRequest(doctorToken)
        .post('/api/prescriptions')
        .send({
          consultationId: consultation.id,
          medications: [
            {
              medicationName: 'Paracetamol',
              dosage: '500mg',
              frequency: 'Cada 8 horas',
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('❌ Test de acceso no autorizado: Crear receta para consulta ajena (403)', async () => {
      // Crear otro doctor
      const otherDoctor = await createTestUser({
        email: 'otherdoctor@example.com',
        password: 'password123',
        role: 'DOCTOR',
        name: 'Other Doctor',
        speciality: 'Cardiología',
      });

      const otherDoctorToken = generateTestTokens(otherDoctor.id, otherDoctor.email, otherDoctor.role).accessToken;

      const response = await authenticatedRequest(otherDoctorToken)
        .post('/api/prescriptions')
        .send({
          consultationId: consultation.id, // Consulta ajena
          medications: [
            {
              medicationName: 'Paracetamol',
              dosage: '500mg',
              frequency: 'Cada 8 horas',
            },
          ],
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it('❌ Test de fallo controlado: Paciente intenta crear receta (403)', async () => {
      const response = await authenticatedRequest(patientToken)
        .post('/api/prescriptions')
        .send({
          consultationId: consultation.id,
          medications: [
            {
              medicationName: 'Paracetamol',
              dosage: '500mg',
              frequency: 'Cada 8 horas',
            },
          ],
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/consultations/:consultationId/prescriptions', () => {
    it('✅ Test feliz: Obtener recetas de consulta propia (200)', async () => {
      const response = await authenticatedRequest(patientToken)
        .get(`/api/consultations/${consultation.id}/prescriptions`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('❌ Test de acceso no autorizado: Obtener recetas de consulta ajena (403)', async () => {
      const response = await authenticatedRequest(otherPatientToken)
        .get(`/api/consultations/${consultation.id}/prescriptions`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });
  });
});

