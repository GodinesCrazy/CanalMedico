-- MIGRACI�N: Campos de validaci�n en tabla doctors
-- Fecha: Enero 2025
-- Versi�n: 1.3.0

-- 1. Agregar campos de validaci�n a tabla doctors
ALTER TABLE "doctors" 
ADD COLUMN IF NOT EXISTS "identidadValidada" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "profesionValidada" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "rnpiEstado" TEXT,
ADD COLUMN IF NOT EXISTS "rnpiProfesion" TEXT,
ADD COLUMN IF NOT EXISTS "rnpiFechaVerificacion" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "verificacionEstadoFinal" TEXT DEFAULT 'PENDIENTE',
ADD COLUMN IF NOT EXISTS "logsValidacion" TEXT,
ADD COLUMN IF NOT EXISTS "identityVerificationData" TEXT,
ADD COLUMN IF NOT EXISTS "rnpiVerificationData" TEXT,
ADD COLUMN IF NOT EXISTS "lastVerificationAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "verificationErrors" TEXT;

-- 2. Crear �ndices para b�squedas de validaci�n
CREATE INDEX IF NOT EXISTS "doctors_verificacionEstadoFinal_idx" 
ON "doctors"("verificacionEstadoFinal");

CREATE INDEX IF NOT EXISTS "doctors_identidadValidada_idx" 
ON "doctors"("identidadValidada");

CREATE INDEX IF NOT EXISTS "doctors_profesionValidada_idx" 
ON "doctors"("profesionValidada");

CREATE INDEX IF NOT EXISTS "doctors_rut_idx" 
ON "doctors"("rut");

-- 3. Verificar que las columnas fueron creadas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'doctors'
AND column_name IN (
    'identidadValidada',
    'profesionValidada',
    'rnpiEstado',
    'rnpiProfesion',
    'rnpiFechaVerificacion',
    'verificacionEstadoFinal',
    'logsValidacion',
    'identityVerificationData',
    'rnpiVerificationData',
    'lastVerificationAt',
    'verificationErrors'
)
ORDER BY column_name;
