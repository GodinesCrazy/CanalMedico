/**
 * Tests de Integración - Consultas
 * Flujo crítico: Crear consulta, acceder a consulta, validación de propiedad (IDOR)
 * 
 * Tests obligatorios para GO a producción:
 * 1. Crear consulta exitosa (201)
 * 2. Acceso a consulta propia (200)
 * 3. Acceso a consulta ajena bloqueado (403)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { cleanDatabase, createTestUser, generateTestTokens, createTestConsultation } from '../helpers/test-setup';
import { authenticatedRequest, unauthenticatedRequest } from '../helpers/test-server';

describe('Consultas - Flujo Crítico', () => {
  let doctorUser: any;
  let patientUser: any;
  let otherPatientUser: any;
  let doctorToken: string;
  let patientToken: string;
  let otherPatientToken: string;

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
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/consultations', () => {
    it('✅ Test feliz: Crear consulta exitosa (201)', async () => {
      const response = await authenticatedRequest(patientToken)
        .post('/api/consultations')
        .send({
          doctorId: doctorUser.doctor!.id,
          patientId: patientUser.patient!.id,
          type: 'NORMAL',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.doctorId).toBe(doctorUser.doctor!.id);
      expect(response.body.data.patientId).toBe(patientUser.patient!.id);
      expect(response.body.data.type).toBe('NORMAL');
    });

    it('❌ Test de fallo controlado: Crear consulta con patientId ajeno (403)', async () => {
      const response = await authenticatedRequest(patientToken)
        .post('/api/consultations')
        .send({
          doctorId: doctorUser.doctor!.id,
          patientId: otherPatientUser.patient!.id, // Intentar crear para otro paciente
          type: 'NORMAL',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/consultations/:id', () => {
    it('✅ Test feliz: Acceso a consulta propia (200)', async () => {
      // Crear consulta
      const consultation = await createTestConsultation({
        doctorId: doctorUser.doctor!.id,
        patientId: patientUser.patient!.id,
        type: 'NORMAL',
      });

      // Paciente accede a su propia consulta
      const response = await authenticatedRequest(patientToken)
        .get(`/api/consultations/${consultation.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(consultation.id);
    });

    it('❌ Test de acceso no autorizado: Acceso a consulta ajena (403)', async () => {
      // Crear consulta del paciente
      const consultation = await createTestConsultation({
        doctorId: doctorUser.doctor!.id,
        patientId: patientUser.patient!.id,
        type: 'NORMAL',
      });

      // Otro paciente intenta acceder
      const response = await authenticatedRequest(otherPatientToken)
        .get(`/api/consultations/${consultation.id}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it('❌ Test de acceso no autorizado: Sin token (401)', async () => {
      const consultation = await createTestConsultation({
        doctorId: doctorUser.doctor!.id,
        patientId: patientUser.patient!.id,
        type: 'NORMAL',
      });

      const response = await unauthenticatedRequest()
        .get(`/api/consultations/${consultation.id}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });
});

