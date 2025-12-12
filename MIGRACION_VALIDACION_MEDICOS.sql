-- MIGRACI�N: Sistema de Validaci�n Autom�tica de M�dicos
-- Fecha: Enero 2025
-- Versi�n: 1.2.0

-- 1. Agregar campos de validaci�n a doctor_signup_requests
ALTER TABLE "doctor_signup_requests" 
ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "identityVerificationStatus" TEXT,
ADD COLUMN IF NOT EXISTS "identityVerificationResult" TEXT,
ADD COLUMN IF NOT EXISTS "identityVerifiedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "rnpiVerificationStatus" TEXT,
ADD COLUMN IF NOT EXISTS "rnpiVerificationResult" TEXT,
ADD COLUMN IF NOT EXISTS "rnpiVerifiedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "autoVerificationErrors" TEXT;

-- 2. Actualizar estados v�lidos (agregar AUTO_APPROVED y AUTO_REJECTED)
-- Nota: Esto es solo documentaci�n, los estados se validan en c�digo

-- 3. Crear �ndices para b�squedas de validaci�n
CREATE INDEX IF NOT EXISTS "doctor_signup_requests_identityVerificationStatus_idx" 
ON "doctor_signup_requests"("identityVerificationStatus");

CREATE INDEX IF NOT EXISTS "doctor_signup_requests_rnpiVerificationStatus_idx" 
ON "doctor_signup_requests"("rnpiVerificationStatus");

CREATE INDEX IF NOT EXISTS "doctor_signup_requests_rut_idx" 
ON "doctor_signup_requests"("rut");

-- 4. Verificar que las columnas fueron creadas
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'doctor_signup_requests'
AND column_name IN (
    'birthDate',
    'identityVerificationStatus',
    'identityVerificationResult',
    'identityVerifiedAt',
    'rnpiVerificationStatus',
    'rnpiVerificationResult',
    'rnpiVerifiedAt',
    'autoVerificationErrors'
)
ORDER BY column_name;
