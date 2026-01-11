#!/usr/bin/env tsx

/**
 * Print Port - Script para debug de puerto y healthcheck
 * 
 * Este script imprime el PORT env y hace fetch local a /health.
 * 
 * Uso:
 *   cd backend
 *   PORT=8080 npm run debug:port
 */

const PORT = process.env.PORT || '8080';
const API_URL = `http://127.0.0.1:${PORT}`;

async function fetchHealth(): Promise<{ success: boolean; status: number; data?: any; error?: string }> {
  try {
    const url = `${API_URL}/health`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'CanalMedico-Debug/1.0',
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
  console.log('DEBUG PORT & HEALTHCHECK');
  console.log('='.repeat(60));
  console.log(`process.env.PORT = ${process.env.PORT || 'not set'}`);
  console.log(`Using PORT = ${PORT}`);
  console.log(`API URL = ${API_URL}`);
  console.log('='.repeat(60));
  console.log('');
  
  console.log(`🔍 Fetching ${API_URL}/health...`);
  const result = await fetchHealth();
  
  if (result.success && result.status === 200) {
    console.log(`   ✅ Status: ${result.status}`);
    console.log(`   📋 Response: ${JSON.stringify(result.data, null, 2)}`);
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ SUCCESS');
    console.log('='.repeat(60));
    console.log(`✅ Server is listening on port ${PORT}`);
    console.log(`✅ /health responds 200 OK`);
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
    console.log('❌ FAILED');
    console.log('='.repeat(60));
    console.log(`❌ Server is NOT listening on port ${PORT}`);
    console.log(`❌ /health does NOT respond 200 OK`);
    console.log('');
    console.log('💡 Verificar:');
    console.log(`   1. Server debe estar corriendo en puerto ${PORT}`);
    console.log(`   2. Endpoint /health debe estar montado`);
    console.log(`   3. Ver logs del servidor para errores`);
    console.log('='.repeat(60));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

