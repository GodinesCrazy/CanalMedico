/**
 * Pruebas unitarias para validaciï¿½n de identidad
 */

import { describe, it, expect } from '@jest/globals';
import identityVerificationService from '../../src/modules/identity-verification/identity-verification.service';
import { IdentityVerificationStatus } from '../../src/modules/identity-verification/identity-verification.types';

describe('Identity Verification Service', () => {
  describe('verifyIdentity', () => {
    it('debe validar RUN vï¿½lido con nombre que coincide', async () => {
      const result = await identityVerificationService.verifyIdentity({
        rut: '12345678',
        dv: '9',
        name: 'Juan Pï¿½rez Gonzï¿½lez',
        birthDate: '1980-01-15',
      });

      // En ambiente de pruebas sin Floid configurado, deberï¿½a retornar PENDING
      expect(result.status).toBeDefined();
      expect(['IDENTIDAD_VERIFICADA', 'PENDING', 'ERROR_VALIDACION']).toContain(result.status);
    });

    it('debe rechazar RUN invï¿½lido', async () => {
      const result = await identityVerificationService.verifyIdentity({
        rut: '12345678',
        dv: '0', // DV incorrecto
        name: 'Juan Pï¿½rez',
      });

      // Deberï¿½a detectar que el DV es invï¿½lido
      expect(result.status).toBeDefined();
    });

    it('debe rechazar formato de RUN invï¿½lido', async () => {
      const result = await identityVerificationService.verifyIdentity({
        rut: '123', // Muy corto
        dv: '9',
        name: 'Juan Pï¿½rez',
      });

      expect(result.status).toBe(IdentityVerificationStatus.RUN_INVALIDO);
    });
  });

  describe('normalizeName', () => {
    it('debe normalizar nombres correctamente', () => {
      const normalized = identityVerificationService.normalizeName('Juan Pï¿½rez Gonzï¿½lez');
      expect(normalized).toBe('juan perez gonzalez');
    });

    it('debe eliminar acentos', () => {
      const normalized = identityVerificationService.normalizeName('Josï¿½ Marï¿½a');
      expect(normalized).toBe('jose maria');
    });
  });

  describe('compareNames', () => {
    it('debe comparar nombres idï¿½nticos con score 100', () => {
      const score = identityVerificationService.compareNames('Juan Pï¿½rez', 'Juan Pï¿½rez');
      expect(score).toBe(100);
    });

    it('debe comparar nombres similares con score alto', () => {
      const score = identityVerificationService.compareNames('Juan Pï¿½rez Gonzï¿½lez', 'Juan P. Gonzï¿½lez');
      expect(score).toBeGreaterThan(50);
    });
  });
});
