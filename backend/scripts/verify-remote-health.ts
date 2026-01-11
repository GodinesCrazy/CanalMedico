#!/usr/bin/env tsx

/**
 * Verify Remote Health - Script para validar healthcheck remoto
 * 
 * Este script hace fetch a /healthz y /health en un servidor remoto
 * (Railway) y valida que respondan 200 OK.
 * 
 * Uso:
 *   cd backend
 *   API_URL=https://canalmedico-production.up.railway.app npm run verify:remote-health
 */

const API_URL = process.env.API_URL || process.env.RAILWAY_PUBLIC_DOMAIN || 'http://localhost:8080';
const MAX_RETRIES = 20;
const RETRY_DELAY_MS = 2000; // 2 segundos

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHealth(endpoint: string): Promise<{ success: boolean; status: number; data?: any; error?: string }> {
  try {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'CanalMedico-HealthCheck/1.0',
      },
    });
    
    let data: any = {};
    try {
      data = await response.json();
    } catch {
      // Si no es JSON, está bien
    }
    
    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      status: 0,
      error: error.message || String(error),
    };
  }
}

async function verifyHealthz(): Promise<boolean> {
  console.log(`\n🔍 Verificando GET ${API_URL}/healthz...`);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await fetchHealth('/healthz');
    
    if (result.success && result.status === 200) {
      console.log(`   ✅ Status: ${result.status}`);
      console.log(`   📋 Response: ${JSON.stringify(result.data)}`);
      console.log(`   ✅ /healthz OK (intento ${attempt}/${MAX_RETRIES})`);
      return true;
    }
    
    if (attempt < MAX_RETRIES) {
      console.log(`   ⏳ Intento ${attempt}/${MAX_RETRIES} falló (status: ${result.status || 'error'}), reintentando en ${RETRY_DELAY_MS / 1000}s...`);
      await sleep(RETRY_DELAY_MS);
    } else {
      console.log(`   ❌ Status: ${result.status || 'error'}`);
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      }
      console.log(`   ❌ /healthz FAILED después de ${MAX_RETRIES} intentos`);
      return false;
    }
  }
  
  return false;
}

async function verifyHealth(): Promise<boolean> {
  console.log(`\n🔍 Verificando GET ${API_URL}/health...`);
  
  const result = await fetchHealth('/health');
  
  if (result.success && result.status === 200) {
    console.log(`   ✅ Status: ${result.status}`);
    console.log(`   📋 Response: ${JSON.stringify(result.data, null, 2)}`);
    console.log(`   ✅ /health OK`);
    return true;
  } else {
    console.log(`   ⚠️ Status: ${result.status || 'error'}`);
    if (result.error) {
      console.log(`   ⚠️ Error: ${result.error}`);
    }
    console.log(`   ⚠️ /health no disponible (pero /healthz puede estar OK)`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('VERIFY REMOTE HEALTH');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`Max retries: ${MAX_RETRIES}`);
  console.log(`Retry delay: ${RETRY_DELAY_MS / 1000}s`);
  console.log('='.repeat(60));
  
  // Verificar /healthz (CRÍTICO para Railway)
  const healthzOk = await verifyHealthz();
  
  if (!healthzOk) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ VERIFICATION FAILED');
    console.log('='.repeat(60));
    console.log('❌ /healthz no responde después de múltiples intentos');
    console.log('❌ Railway healthcheck probablemente fallará');
    console.log('\n💡 Verificar:');
    console.log('   1. Railway Dashboard: Root Directory = backend');
    console.log('   2. Railway Dashboard: Healthcheck Path = /healthz');
    console.log('   3. Railway Dashboard: Start Command = node dist/server.js');
    console.log('   4. Railway logs para ver errores de startup');
    process.exit(1);
  }
  
  // Verificar /health (OPCIONAL, pero recomendado)
  await verifyHealth();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ VERIFICATION PASSED');
  console.log('='.repeat(60));
  console.log('✅ /healthz responde 200 OK');
  console.log('✅ Railway healthcheck debería pasar');
  console.log('='.repeat(60));
  
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

