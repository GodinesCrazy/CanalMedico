/**
 * Tests de Integración - Autenticación
 * Flujo crítico: Login, registro, refresh token
 * 
 * Tests obligatorios para GO a producción:
 * 1. Login exitoso (200)
 * 2. Login con credenciales inválidas (401)
 * 3. Acceso a endpoint protegido sin token (401)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { cleanDatabase, createTestUser, generateTestTokens } from '../helpers/test-setup';
import { authenticatedRequest, unauthenticatedRequest } from '../helpers/test-server';

describe('Autenticación - Flujo Crítico', () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('✅ Test feliz: Registro exitoso (201)', async () => {
      const response = await unauthenticatedRequest()
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          role: 'PATIENT',
          age: 30,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('❌ Test de fallo controlado: Email duplicado (409)', async () => {
      // Crear usuario primero
      await createTestUser({
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'PATIENT',
        name: 'First User',
      });

      // Intentar registrar mismo email
      const response = await unauthenticatedRequest()
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Second User',
          role: 'PATIENT',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('✅ Test feliz: Login exitoso (200)', async () => {
      // Crear usuario de prueba
      const user = await createTestUser({
        email: 'login@example.com',
        password: 'password123',
        role: 'PATIENT',
        name: 'Login User',
      });

      // Intentar login
      const response = await unauthenticatedRequest()
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('login@example.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('❌ Test de acceso no autorizado: Credenciales inválidas (401)', async () => {
      // Crear usuario de prueba
      await createTestUser({
        email: 'wrong@example.com',
        password: 'password123',
        role: 'PATIENT',
        name: 'Wrong User',
      });

      // Intentar login con contraseña incorrecta
      const response = await unauthenticatedRequest()
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/users/profile', () => {
    it('✅ Test feliz: Acceso autorizado con token válido (200)', async () => {
      // Crear usuario y generar token
      const user = await createTestUser({
        email: 'authenticated@example.com',
        password: 'password123',
        role: 'PATIENT',
        name: 'Authenticated User',
      });

      const tokens = generateTestTokens(user.id, user.email, user.role);

      // Acceder a endpoint protegido
      const response = await authenticatedRequest(tokens.accessToken)
        .get('/api/users/profile');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('❌ Test de acceso no autorizado: Sin token (401)', async () => {
      const response = await unauthenticatedRequest()
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('❌ Test de acceso no autorizado: Token inválido (401)', async () => {
      const response = await authenticatedRequest('invalid-token-123')
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('✅ Test feliz: Logout exitoso invalida token (200)', async () => {
      // Crear usuario y login
      const user = await createTestUser({
        email: 'logout@example.com',
        password: 'password123',
        role: 'PATIENT',
        name: 'Logout User',
      });

      // Login para obtener token
      const loginResponse = await unauthenticatedRequest()
        .post('/api/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'password123',
        });

      expect(loginResponse.status).toBe(200);
      const accessToken = loginResponse.body.data.accessToken;

      // Hacer logout
      const logoutResponse = await authenticatedRequest(accessToken)
        .post('/api/auth/logout');

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);
      expect(logoutResponse.body.data.success).toBe(true);
    });

    it('❌ Test de seguridad: Token blacklisted después de logout no funciona (401)', async () => {
      // Crear usuario y login
      const user = await createTestUser({
        email: 'blacklist@example.com',
        password: 'password123',
        role: 'PATIENT',
        name: 'Blacklist User',
      });

      // Login para obtener token
      const loginResponse = await unauthenticatedRequest()
        .post('/api/auth/login')
        .send({
          email: 'blacklist@example.com',
          password: 'password123',
        });

      expect(loginResponse.status).toBe(200);
      const accessToken = loginResponse.body.data.accessToken;

      // Hacer logout para blacklistear el token
      const logoutResponse = await authenticatedRequest(accessToken)
        .post('/api/auth/logout');

      expect(logoutResponse.status).toBe(200);

      // Intentar usar el mismo token después de logout
      const response = await authenticatedRequest(accessToken)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('❌ Test de acceso no autorizado: Logout sin token (401)', async () => {
      const response = await unauthenticatedRequest()
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });
});

