#!/usr/bin/env node

/**
 * Script de Verificación de Deploy en Railway
 * 
 * Valida que el backend desplegado en Railway tiene los endpoints correctos
 * y que el deploy está actualizado.
 * 
 * Uso:
 *   API_URL=https://canalmedico-production.up.railway.app npm run verify:railway
 */

const API_URL = process.env.API_URL || 'https://canalmedico-production.up.railway.app';

interface VerificationResult {
  endpoint: string;
  status: number;
  success: boolean;
  message: string;
}

const results: VerificationResult[] = [];

async function fetchJson(url: string, options: RequestInit = {}): Promise<{ status: number; data: any }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });
    const data = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
    return { status: response.status, data };
  } catch (error: any) {
    return { status: 0, data: { error: error.message || 'Network error' } };
  }
}

async function verifyHealth(): Promise<boolean> {
  console.log('🔍 Verificando GET /health...');
  const response = await fetchJson(`${API_URL}/health`);
  
  const success = response.status === 200;
  results.push({
    endpoint: 'GET /health',
    status: response.status,
    success,
    message: success ? '✅ Health check OK' : `❌ Health check failed: ${response.status}`,
  });
  
  console.log(`  ${success ? '✅' : '❌'} Status: ${response.status}`);
  return success;
}

async function verifySeedHealth(): Promise<boolean> {
  console.log('🔍 Verificando GET /api/seed/health...');
  const response = await fetchJson(`${API_URL}/api/seed/health`);
  
  const success = response.status === 200;
  results.push({
    endpoint: 'GET /api/seed/health',
    status: response.status,
    success,
    message: success ? '✅ Seed module mounted' : `❌ Seed module NOT mounted: ${response.status}`,
  });
  
  if (success && response.data) {
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  📋 Message: ${response.data.message || 'N/A'}`);
    console.log(`  📋 ENABLE_TEST_DATA: ${response.data.enableTestData || 'N/A'}`);
    console.log(`  📋 Routes: ${response.data.routes?.join(', ') || 'N/A'}`);
  } else {
    console.log(`  ❌ Status: ${response.status}`);
    if (response.data?.error) {
      console.log(`  ❌ Error: ${response.data.error}`);
    }
  }
  
  return success;
}

async function verifySeedTestData(): Promise<boolean> {
  console.log('🔍 Verificando POST /api/seed/test-data (debería ser 403 si ENABLE_TEST_DATA=false)...');
  const response = await fetchJson(`${API_URL}/api/seed/test-data`, {
    method: 'POST',
  });
  
  // Esperamos 200 si ENABLE_TEST_DATA=true, o 403 si false
  // Pero NO esperamos 404 (eso significaría que el endpoint no existe)
  const success = response.status !== 404;
  const expected = response.status === 200 || response.status === 403;
  
  results.push({
    endpoint: 'POST /api/seed/test-data',
    status: response.status,
    success,
    message: response.status === 404 
      ? '❌ Endpoint NOT found (404) - Deploy may be outdated'
      : expected 
        ? `✅ Endpoint exists (${response.status === 200 ? 'ENABLED' : 'DISABLED'})`
        : `⚠️ Unexpected status: ${response.status}`,
  });
  
  console.log(`  ${success ? (expected ? '✅' : '⚠️') : '❌'} Status: ${response.status}`);
  if (response.data?.error) {
    console.log(`  📋 Message: ${response.data.error}`);
  }
  
  return success && expected;
}

async function main() {
  console.log('========================================');
  console.log('Railway Deploy Verification');
  console.log('========================================');
  console.log(`API URL: ${API_URL}`);
  console.log('========================================');
  console.log('');

  let allPassed = true;

  // Verificación 1: Health Check
  const healthOk = await verifyHealth();
  allPassed = allPassed && healthOk;
  console.log('');

  // Verificación 2: Seed Health
  const seedHealthOk = await verifySeedHealth();
  allPassed = allPassed && seedHealthOk;
  console.log('');

  // Verificación 3: Seed Test-Data (debe existir, aunque pueda devolver 403)
  const seedTestDataOk = await verifySeedTestData();
  allPassed = allPassed && seedTestDataOk;
  console.log('');

  // Resumen
  console.log('========================================');
  console.log('RESUMEN DE VERIFICACIÓN');
  console.log('========================================');
  
  results.forEach((result) => {
    console.log(`${result.success ? '✅' : '❌'} ${result.endpoint}: ${result.message}`);
  });
  
  console.log('========================================');
  
  if (allPassed) {
    console.log('✅ DEPLOY OK - Todos los endpoints funcionan correctamente');
    console.log('✅ El backend está desplegado y actualizado');
    process.exit(0);
  } else {
    console.log('❌ DEPLOY FAIL - Algunos endpoints no funcionan');
    console.log('❌ Verificar que Railway ha desplegado el último commit');
    console.log('');
    console.log('Acciones recomendadas:');
    console.log('1. Verificar que Railway está apuntando a branch "main"');
    console.log('2. Verificar que root directory está configurado como "backend"');
    console.log('3. Forzar redeploy en Railway Dashboard');
    console.log('4. Verificar logs de Railway para errores de build');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});

