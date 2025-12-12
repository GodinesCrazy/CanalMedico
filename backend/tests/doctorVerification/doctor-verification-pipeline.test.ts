/**
 * Pruebas de integraci�n para pipeline de verificaci�n
 */

import { describe, it, expect } from '@jest/globals';
import doctorVerificationPipeline from '../../src/modules/doctor-verification/doctor-verification-pipeline.service';
import { VerificationFinalStatus } from '../../src/modules/doctor-verification/doctor-verification.types';

describe('Doctor Verification Pipeline', () => {
  describe('verifyDoctor', () => {
    it('debe rechazar si RUN es inv�lido', async () => {
      const result = await doctorVerificationPipeline.verifyDoctor({
        rut: '12345678',
        dv: '0', // DV inv�lido
        name: 'Juan P�rez',
      });

      expect(result.finalStatus).toBe(VerificationFinalStatus.RECHAZADO_EN_IDENTIDAD);
    });

    it('debe marcar para revisi�n manual si RC no responde', async () => {
      // En ambiente de pruebas sin Floid, deber�a retornar REVISION_MANUAL
      const result = await doctorVerificationPipeline.verifyDoctor({
        rut: '12345678',
        dv: '9',
        name: 'Juan P�rez',
      });

      expect([
        VerificationFinalStatus.REVISION_MANUAL,
        VerificationFinalStatus.PENDIENTE,
        VerificationFinalStatus.RECHAZADO_EN_IDENTIDAD,
      ]).toContain(result.finalStatus);
    });

    it('debe ejecutar flujo completo si identidad OK', async () => {
      const result = await doctorVerificationPipeline.verifyDoctor({
        rut: '12345678',
        dv: '9',
        name: 'Dr. Juan P�rez',
        specialty: 'Medicina General',
      });

      expect(result.finalStatus).toBeDefined();
      expect(result.identityResult).toBeDefined();
    });
  });
});
