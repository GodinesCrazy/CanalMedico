#!/usr/bin/env tsx

/**
 * Verify Railway Port - Script para validar puerto y healthcheck en Railway
 * 
 * Este script hace fetch a /health desde API_URL y valida que responda 200 OK.
 * 
 * Uso:
 *   cd backend
 *   API_URL=https://canalmedico-production.up.railway.app npm run verify:railway
 */

const API_URL = process.env.API_URL || process.env.RAILWAY_PUBLIC_DOMAIN || 'http://localhost:3000';

async function fetchHealth(): Promise<{ success: boolean; status: number; data?: any; error?: string }> {
  try {
    const url = `${API_URL}/health`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
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

async function main() {
  console.log('='.repeat(60));
  console.log('VERIFY RAILWAY PORT & HEALTHCHECK');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`Endpoint: ${API_URL}/health`);
  console.log('='.repeat(60));
  console.log('');
  
  console.log('🔍 Verificando GET /health...');
  const result = await fetchHealth();
  
  if (result.success && result.status === 200) {
    console.log(`   ✅ Status: ${result.status}`);
    console.log(`   📋 Response: ${JSON.stringify(result.data, null, 2)}`);
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ VERIFICATION PASSED');
    console.log('='.repeat(60));
    console.log('✅ /health responde 200 OK');
    console.log('✅ Railway healthcheck debería pasar');
    console.log('='.repeat(60));
    process.exit(0);
  } else {
    console.log(`   ❌ Status: ${result.status || 'error'}`);
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
    if (result.data) {
      console.log(`   📋 Response: ${JSON.stringify(result.data, null, 2)}`);
    }
    console.log('');
    console.log('='.repeat(60));
    console.log('❌ VERIFICATION FAILED');
    console.log('='.repeat(60));
    console.log('❌ /health no responde 200 OK');
    console.log('❌ Railway healthcheck probablemente fallará');
    console.log('');
    console.log('💡 Verificar:');
    console.log('   1. Railway Dashboard: Root Directory = backend');
    console.log('   2. Railway Dashboard: Healthcheck Path = /healthz o /health');
    console.log('   3. Railway Dashboard: Start Command = node dist/server.js');
    console.log('   4. Railway logs para ver PORT env y errores de startup');
    console.log('='.repeat(60));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

