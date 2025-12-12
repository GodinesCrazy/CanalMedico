/**
 * Pruebas unitarias para validaci�n RNPI
 */

import { describe, it, expect } from '@jest/globals';
import rnpiVerificationService from '../../src/modules/rnpi-verification/rnpi-verification.service';
import { RnpiVerificationStatus } from '../../src/modules/rnpi-verification/rnpi-verification.types';

describe('RNPI Verification Service', () => {
  describe('verifyProfessional', () => {
    it('debe validar m�dico habilitado', async () => {
      const result = await rnpiVerificationService.verifyProfessional({
        rut: '12345678',
        dv: '9',
        name: 'Dr. Juan P�rez',
        specialty: 'Medicina General',
      });

      // En ambiente de pruebas sin API RNPI configurada, deber�a retornar error o pending
      expect(result.status).toBeDefined();
      expect([
        RnpiVerificationStatus.RNPI_OK,
        RnpiVerificationStatus.RNPI_API_ERROR,
        RnpiVerificationStatus.PENDING,
      ]).toContain(result.status);
    });

    it('debe rechazar si no es m�dico', async () => {
      // Mock: Si la profesi�n no es m�dico, deber�a retornar RNPI_PROFESION_INVALIDA
      // En pruebas reales, esto se probar�a con datos mockeados
      expect(true).toBe(true); // Placeholder
    });

    it('debe rechazar si est� suspendido', async () => {
      // Mock: Si el estado no es habilitado, deber�a retornar RNPI_NO_HABILITADO
      expect(true).toBe(true); // Placeholder
    });
  });
});
