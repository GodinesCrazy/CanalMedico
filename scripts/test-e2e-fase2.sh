#!/bin/bash

# Script de Prueba E2E - FASE 2.2
# Validación End-to-End del flujo completo de consultas médicas
#
# Uso:
#   export API_URL="https://canalmedico-production.up.railway.app"
#   bash scripts/test-e2e-fase2.sh

set -e  # Salir si hay error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
API_URL="${API_URL:-https://canalmedico-production.up.railway.app}"
TEST_REPORT_DIR="docs/test-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Credenciales de prueba
ADMIN_EMAIL="admin@canalmedico.com"
ADMIN_PASSWORD="Admin123!"
DOCTOR_EMAIL="doctor.test@canalmedico.com"
DOCTOR_PASSWORD="DoctorTest123!"
PATIENT_EMAIL="patient.test@canalmedico.com"
PATIENT_PASSWORD="PatientTest123!"

# Tokens (se llenarán durante las pruebas)
ADMIN_TOKEN=""
DOCTOR_TOKEN=""
PATIENT_TOKEN=""
DOCTOR_ID=""
PATIENT_ID=""
CONSULTATION_ID=""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}FASE 2.2 - Prueba E2E${NC}"
echo -e "${BLUE}API URL: ${API_URL}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Función helper para hacer requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    local headers=(-H "Content-Type: application/json")
    if [ ! -z "$token" ]; then
        headers+=(-H "Authorization: Bearer $token")
    fi
    
    if [ -z "$data" ]; then
        curl -s -X "$method" "${API_URL}${endpoint}" "${headers[@]}"
    else
        curl -s -X "$method" "${API_URL}${endpoint}" "${headers[@]}" -d "$data"
    fi
}

# Función para verificar respuesta
check_response() {
    local response=$1
    local expected_status=$2
    local description=$3
    
    local status=$(echo "$response" | jq -r '.success // .status // "unknown"')
    
    if [ "$status" = "true" ] || [ "$status" = "UP" ] || [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        return 0
    else
        echo -e "${RED}❌ $description${NC}"
        echo -e "${RED}Respuesta: $response${NC}"
        return 1
    fi
}

# Paso 0: Verificar Health Check
echo -e "${YELLOW}[PASO 0] Verificando Health Check...${NC}"
HEALTH_RESPONSE=$(make_request "GET" "/health" "" "")
check_response "$HEALTH_RESPONSE" "UP" "Health Check OK"
echo ""

# Paso 1: Login como ADMIN
echo -e "${YELLOW}[PASO 1] Login como ADMIN...${NC}"
ADMIN_LOGIN_RESPONSE=$(make_request "POST" "/api/auth/login" "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" "")
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN_RESPONSE" | jq -r '.data.accessToken // empty')
if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Login ADMIN falló${NC}"
    echo "Respuesta: $ADMIN_LOGIN_RESPONSE"
    exit 1
fi
check_response "$ADMIN_LOGIN_RESPONSE" "true" "Login ADMIN exitoso"
echo ""

# Paso 2: Login como DOCTOR
echo -e "${YELLOW}[PASO 2] Login como DOCTOR...${NC}"
DOCTOR_LOGIN_RESPONSE=$(make_request "POST" "/api/auth/login" "{\"email\":\"${DOCTOR_EMAIL}\",\"password\":\"${DOCTOR_PASSWORD}\"}" "")
DOCTOR_TOKEN=$(echo "$DOCTOR_LOGIN_RESPONSE" | jq -r '.data.accessToken // empty')
if [ -z "$DOCTOR_TOKEN" ] || [ "$DOCTOR_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Login DOCTOR falló${NC}"
    echo "Respuesta: $DOCTOR_LOGIN_RESPONSE"
    exit 1
fi
# Obtener doctorId del perfil
DOCTOR_PROFILE=$(make_request "GET" "/api/users/profile" "" "$DOCTOR_TOKEN")
DOCTOR_ID=$(echo "$DOCTOR_PROFILE" | jq -r '.data.profile.id // empty')
check_response "$DOCTOR_LOGIN_RESPONSE" "true" "Login DOCTOR exitoso"
echo ""

# Paso 3: Login como PATIENT
echo -e "${YELLOW}[PASO 3] Login como PATIENT...${NC}"
PATIENT_LOGIN_RESPONSE=$(make_request "POST" "/api/auth/login" "{\"email\":\"${PATIENT_EMAIL}\",\"password\":\"${PATIENT_PASSWORD}\"}" "")
PATIENT_TOKEN=$(echo "$PATIENT_LOGIN_RESPONSE" | jq -r '.data.accessToken // empty')
if [ -z "$PATIENT_TOKEN" ] || [ "$PATIENT_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Login PATIENT falló${NC}"
    echo "Respuesta: $PATIENT_LOGIN_RESPONSE"
    exit 1
fi
# Obtener patientId del perfil
PATIENT_PROFILE=$(make_request "GET" "/api/users/profile" "" "$PATIENT_TOKEN")
PATIENT_ID=$(echo "$PATIENT_PROFILE" | jq -r '.data.profile.id // empty')
check_response "$PATIENT_LOGIN_RESPONSE" "true" "Login PATIENT exitoso"
echo ""

# Paso 4: PACIENTE crea consulta (Escenario A)
echo -e "${YELLOW}[PASO 4 - Escenario A] PACIENTE crea consulta...${NC}"
if [ -z "$DOCTOR_ID" ] || [ -z "$PATIENT_ID" ]; then
    echo -e "${RED}❌ No se pudieron obtener DOCTOR_ID o PATIENT_ID${NC}"
    exit 1
fi
CONSULTATION_DATA="{\"doctorId\":\"${DOCTOR_ID}\",\"patientId\":\"${PATIENT_ID}\",\"type\":\"NORMAL\",\"price\":15000}"
CREATE_CONSULTATION_RESPONSE=$(make_request "POST" "/api/consultations" "$CONSULTATION_DATA" "$PATIENT_TOKEN")
CONSULTATION_ID=$(echo "$CREATE_CONSULTATION_RESPONSE" | jq -r '.data.id // empty')
CONSULTATION_STATUS=$(echo "$CREATE_CONSULTATION_RESPONSE" | jq -r '.data.status // empty')
if [ -z "$CONSULTATION_ID" ] || [ "$CONSULTATION_STATUS" != "PENDING" ]; then
    echo -e "${RED}❌ Crear consulta falló${NC}"
    echo "Respuesta: $CREATE_CONSULTATION_RESPONSE"
    exit 1
fi
check_response "$CREATE_CONSULTATION_RESPONSE" "true" "Consulta creada (status: PENDING)"
echo "  Consultation ID: $CONSULTATION_ID"
echo ""

# Paso 5: DOCTOR ve consultas PENDING (Escenario B)
echo -e "${YELLOW}[PASO 5 - Escenario B] DOCTOR ve consultas PENDING...${NC}"
DOCTOR_CONSULTATIONS=$(make_request "GET" "/api/doctor/consultations?status=PENDING" "" "$DOCTOR_TOKEN")
CONSULTATION_FOUND=$(echo "$DOCTOR_CONSULTATIONS" | jq -r ".data[] | select(.id == \"${CONSULTATION_ID}\") | .id // empty")
if [ -z "$CONSULTATION_FOUND" ]; then
    echo -e "${RED}❌ DOCTOR no ve la consulta PENDING${NC}"
    echo "Respuesta: $DOCTOR_CONSULTATIONS"
    exit 1
fi
check_response "$DOCTOR_CONSULTATIONS" "true" "DOCTOR ve consulta PENDING"
echo ""

# Paso 6: DOCTOR acepta consulta (Escenario C)
echo -e "${YELLOW}[PASO 6 - Escenario C] DOCTOR acepta consulta (PENDING → ACTIVE)...${NC}"
ACCEPT_RESPONSE=$(make_request "PATCH" "/api/consultations/${CONSULTATION_ID}/accept" "" "$DOCTOR_TOKEN")
ACCEPTED_STATUS=$(echo "$ACCEPT_RESPONSE" | jq -r '.data.status // empty')
STARTED_AT=$(echo "$ACCEPT_RESPONSE" | jq -r '.data.startedAt // empty')
if [ "$ACCEPTED_STATUS" != "ACTIVE" ] || [ -z "$STARTED_AT" ] || [ "$STARTED_AT" = "null" ]; then
    echo -e "${RED}❌ Aceptar consulta falló${NC}"
    echo "Respuesta: $ACCEPT_RESPONSE"
    exit 1
fi
check_response "$ACCEPT_RESPONSE" "true" "Consulta aceptada (status: ACTIVE, startedAt: $STARTED_AT)"
echo ""

# Paso 7: DOCTOR completa consulta (Escenario D)
echo -e "${YELLOW}[PASO 7 - Escenario D] DOCTOR completa consulta (ACTIVE → COMPLETED)...${NC}"
COMPLETE_RESPONSE=$(make_request "PATCH" "/api/consultations/${CONSULTATION_ID}/complete" "" "$DOCTOR_TOKEN")
COMPLETED_STATUS=$(echo "$COMPLETE_RESPONSE" | jq -r '.data.status // empty')
ENDED_AT=$(echo "$COMPLETE_RESPONSE" | jq -r '.data.endedAt // empty')
if [ "$COMPLETED_STATUS" != "COMPLETED" ] || [ -z "$ENDED_AT" ] || [ "$ENDED_AT" = "null" ]; then
    echo -e "${RED}❌ Completar consulta falló${NC}"
    echo "Respuesta: $COMPLETE_RESPONSE"
    exit 1
fi
check_response "$COMPLETE_RESPONSE" "true" "Consulta completada (status: COMPLETED, endedAt: $ENDED_AT)"
echo ""

# Paso 8: ADMIN verifica consultas globales (Escenario E)
echo -e "${YELLOW}[PASO 8 - Escenario E] ADMIN verifica consultas globales...${NC}"
ADMIN_CONSULTATIONS=$(make_request "GET" "/api/admin/consultations?status=COMPLETED" "" "$ADMIN_TOKEN")
ADMIN_CONSULTATION_FOUND=$(echo "$ADMIN_CONSULTATIONS" | jq -r ".data[] | select(.id == \"${CONSULTATION_ID}\") | .id // empty")
if [ -z "$ADMIN_CONSULTATION_FOUND" ]; then
    echo -e "${RED}❌ ADMIN no ve la consulta COMPLETED${NC}"
    echo "Respuesta: $ADMIN_CONSULTATIONS"
    exit 1
fi
check_response "$ADMIN_CONSULTATIONS" "true" "ADMIN ve consulta COMPLETED"
echo ""

# Resumen final
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ TODOS LOS ESCENARIOS PASARON${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Resumen:"
echo "  - Health Check: ✅"
echo "  - Login ADMIN: ✅"
echo "  - Login DOCTOR: ✅"
echo "  - Login PATIENT: ✅"
echo "  - Escenario A (PACIENTE crea consulta): ✅"
echo "  - Escenario B (DOCTOR ve consultas): ✅"
echo "  - Escenario C (DOCTOR acepta): ✅"
echo "  - Escenario D (DOCTOR completa): ✅"
echo "  - Escenario E (ADMIN verifica): ✅"
echo ""

