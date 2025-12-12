-- ============================================
-- MIGRACIÓN: Disponibilidad Automática y Solicitudes de Registro
-- CanalMedico - Ejecutar en PostgreSQL de Railway
-- ============================================

-- 1. Agregar campos a la tabla doctors
ALTER TABLE "doctors" 
ADD COLUMN IF NOT EXISTS "modoDisponibilidad" TEXT NOT NULL DEFAULT 'MANUAL';

ALTER TABLE "doctors" 
ADD COLUMN IF NOT EXISTS "horariosAutomaticos" TEXT;

-- 2. Crear tabla doctor_signup_requests
CREATE TABLE IF NOT EXISTS "doctor_signup_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rut" TEXT,
    "specialty" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "clinicOrCenter" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    CONSTRAINT "doctor_signup_requests_pkey" PRIMARY KEY ("id")
);

-- 3. Crear índices para doctor_signup_requests
CREATE INDEX IF NOT EXISTS "doctor_signup_requests_status_idx" 
ON "doctor_signup_requests"("status");

CREATE INDEX IF NOT EXISTS "doctor_signup_requests_email_idx" 
ON "doctor_signup_requests"("email");

CREATE INDEX IF NOT EXISTS "doctor_signup_requests_createdAt_idx" 
ON "doctor_signup_requests"("createdAt");

-- ============================================
-- VERIFICACIONES (Opcional - Ejecutar para confirmar)
-- ============================================

-- Verificar que los campos se agregaron a doctors
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'doctors' 
AND column_name IN ('modoDisponibilidad', 'horariosAutomaticos');

-- Verificar que la tabla doctor_signup_requests existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'doctor_signup_requests';

-- Verificar índices creados
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'doctor_signup_requests';

