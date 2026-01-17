#!/bin/bash
# Script para levantar DB de test, aplicar migraciones y correr tests
# Uso: ./scripts/test-db.sh [test|down]

set -e

COMPOSE_FILE="docker-compose.test.yml"
DB_CONTAINER="canalmedico-postgres-test"
DB_NAME="canalmedico_test"
DB_USER="canalmedico_test"
DB_PASSWORD="canalmedico_test_123"
DB_PORT="5433"

# Función para esperar a que PostgreSQL esté listo
wait_for_postgres() {
  echo "? Esperando a que PostgreSQL esté listo..."
  max_attempts=30
  attempt=0
  
  while [ $attempt -lt $max_attempts ]; do
    if docker exec $DB_CONTAINER pg_isready -U $DB_USER > /dev/null 2>&1; then
      echo "? PostgreSQL está listo"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 1
  done
  
  echo "? Timeout esperando PostgreSQL"
  return 1
}

# Función para aplicar migraciones
apply_migrations() {
  echo "?? Aplicando migraciones Prisma..."
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}" \
    npx prisma migrate deploy
  echo "? Migraciones aplicadas"
}

# Función para generar cliente Prisma
generate_prisma_client() {
  echo "?? Generando cliente Prisma..."
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}" \
    npx prisma generate
  echo "? Cliente Prisma generado"
}

case "$1" in
  "test")
    echo "?? Iniciando tests con DB de test..."
    
    # Levantar contenedor
    echo "?? Levantando contenedor PostgreSQL de test..."
    docker-compose -f $COMPOSE_FILE up -d
    
    # Esperar a que esté listo
    wait_for_postgres
    
    # Aplicar migraciones
    apply_migrations
    
    # Generar cliente Prisma
    generate_prisma_client
    
    # Correr tests
    echo "?? Ejecutando tests..."
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}" \
      NODE_ENV=test \
      npm test
    
    # Apagar contenedor
    echo "?? Apagando contenedor de test..."
    docker-compose -f $COMPOSE_FILE down
    ;;
    
  "down")
    echo "?? Apagando contenedor de test..."
    docker-compose -f $COMPOSE_FILE down
    ;;
    
  *)
    echo "Uso: $0 {test|down}"
    echo ""
    echo "Comandos:"
    echo "  test  - Levanta DB, aplica migraciones y corre tests"
    echo "  down  - Apaga contenedor de test"
    exit 1
    ;;
esac
