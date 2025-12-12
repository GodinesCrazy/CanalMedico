-- MIGRACI�N: Integraci�n con Sistema Nacional de Receta Electr�nica (SNRE)
-- Fecha: Enero 2025
-- Versi�n: 1.1.0

-- 1. Agregar campos al modelo Patient para SNRE
ALTER TABLE "patients" 
ADD COLUMN IF NOT EXISTS "rut" TEXT,
ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "gender" TEXT,
ADD COLUMN IF NOT EXISTS "address" TEXT;

-- �ndice para RUT de pacientes
CREATE INDEX IF NOT EXISTS "patients_rut_idx" ON "patients"("rut");

-- 2. Crear tabla de recetas (prescriptions)
CREATE TABLE IF NOT EXISTS "prescriptions" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE_ENVIO_SNRE',
    "snreId" TEXT UNIQUE,
    "snreCode" TEXT,
    "snreBundleId" TEXT,
    "fhirBundle" TEXT,
    "errorMessage" TEXT,
    "errorDetails" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentToSnreAt" TIMESTAMP,
    
    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "prescriptions_consultationId_fkey" FOREIGN KEY ("consultationId") 
        REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Crear tabla de items de medicamentos (prescription_items)
CREATE TABLE IF NOT EXISTS "prescription_items" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "tfcCode" TEXT,
    "snomedCode" TEXT,
    "presentation" TEXT,
    "pharmaceuticalForm" TEXT,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT,
    "quantity" TEXT,
    "instructions" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") 
        REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Crear �ndices para prescriptions
CREATE INDEX IF NOT EXISTS "prescriptions_consultationId_idx" ON "prescriptions"("consultationId");
CREATE INDEX IF NOT EXISTS "prescriptions_doctorId_idx" ON "prescriptions"("doctorId");
CREATE INDEX IF NOT EXISTS "prescriptions_patientId_idx" ON "prescriptions"("patientId");
CREATE INDEX IF NOT EXISTS "prescriptions_status_idx" ON "prescriptions"("status");
CREATE INDEX IF NOT EXISTS "prescriptions_snreId_idx" ON "prescriptions"("snreId");
CREATE INDEX IF NOT EXISTS "prescriptions_createdAt_idx" ON "prescriptions"("createdAt");

-- 5. Crear �ndices para prescription_items
CREATE INDEX IF NOT EXISTS "prescription_items_prescriptionId_idx" ON "prescription_items"("prescriptionId");
CREATE INDEX IF NOT EXISTS "prescription_items_tfcCode_idx" ON "prescription_items"("tfcCode");

-- 6. Agregar relaci�n de prescriptions a consultations
-- (Ya est� en el schema, pero verificamos que la foreign key existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'prescriptions_consultationId_fkey'
    ) THEN
        ALTER TABLE "prescriptions" 
        ADD CONSTRAINT "prescriptions_consultationId_fkey" 
        FOREIGN KEY ("consultationId") 
        REFERENCES "consultations"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Verificar que las tablas fueron creadas
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('prescriptions', 'prescription_items', 'patients')
ORDER BY table_name, ordinal_position;
