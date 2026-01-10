/**
 * Tests de Integración - Mensajería
 * Flujo crítico: Enviar mensaje, obtener mensajes, validación de propiedad (IDOR)
 * 
 * Tests obligatorios para GO a producción:
 * 1. Enviar mensaje exitoso (201)
 * 2. Obtener mensajes de consulta propia (200)
 * 3. Acceso a mensajes de consulta ajena bloqueado (403)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { cleanDatabase, createTestUser, generateTestTokens, createTestConsultation } from '../helpers/test-setup';
import { authenticatedRequest, unauthenticatedRequest } from '../helpers/test-server';

describe('Mensajería - Flujo Crítico', () => {
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

  describe('POST /api/messages', () => {
    it('✅ Test feliz: Enviar mensaje exitoso (201)', async () => {
      const response = await authenticatedRequest(patientToken)
        .post('/api/messages')
        .send({
          consultationId: consultation.id,
          senderId: patientUser.patient!.id,
          text: 'Mensaje de prueba',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.text).toBe('Mensaje de prueba');
      expect(response.body.data.consultationId).toBe(consultation.id);
    });

    it('❌ Test de acceso no autorizado: Enviar mensaje en consulta ajena (403)', async () => {
      const response = await authenticatedRequest(otherPatientToken)
        .post('/api/messages')
        .send({
          consultationId: consultation.id, // Consulta ajena
          senderId: otherPatientUser.patient!.id,
          text: 'Mensaje no autorizado',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it('❌ Test de fallo controlado: Enviar mensaje como otro usuario (403)', async () => {
      const response = await authenticatedRequest(patientToken)
        .post('/api/messages')
        .send({
          consultationId: consultation.id,
          senderId: otherPatientUser.patient!.id, // Intentar enviar como otro usuario
          text: 'Mensaje malicioso',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/messages/consultation/:consultationId', () => {
    it('✅ Test feliz: Obtener mensajes de consulta propia (200)', async () => {
      // Primero crear un mensaje
      await authenticatedRequest(patientToken)
        .post('/api/messages')
        .send({
          consultationId: consultation.id,
          senderId: patientUser.patient!.id,
          text: 'Mensaje de prueba',
        });

      // Obtener mensajes
      const response = await authenticatedRequest(patientToken)
        .get(`/api/messages/consultation/${consultation.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('❌ Test de acceso no autorizado: Obtener mensajes de consulta ajena (403)', async () => {
      const response = await authenticatedRequest(otherPatientToken)
        .get(`/api/messages/consultation/${consultation.id}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });
  });
});

