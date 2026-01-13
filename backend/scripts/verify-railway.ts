#!/usr/bin/env tsx

/**
 * Verify Railway Deployment - Script para validar deploy en Railway
 * 
 * Este script valida que:
 * 1. GET /health responde 200 OK
 * 2. GET /deploy-info responde 200 OK con formato correcto
 * 
 * Uso:
 *   cd backend
 *   API_URL=https://canalmedico-production.up.railway.app npm run verify:railway
 */

const API_URL = process.env.API_URL || process.env.RAILWAY_PUBLIC_DOMAIN || 'http://localhost:8080';

interface HealthResponse {
  ok: boolean;
  status: string;
  timestamp: string;
  uptime: string;
  environment: string;
  version: string;
  commit: string;
  services?: {
    database: string;
    migrations: string;
  };
}

interface DeployInfoResponse {
  ok: boolean;
  version: string;
  commitHash: string;
  environment: string;
  timestamp: string;
}

async function fetchJson<T>(url: string): Promise<{ success: boolean; status: number; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'CanalMedico-Railway-Verify/1.0',
      },
    });
    
    let data: T | undefined;
    try {
      data = await response.json() as T;
    } catch {
      return {
        success: false,
        status: response.status,
        error: 'Invalid JSON response',
      };
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

async function verifyHealth(): Promise<boolean> {
  console.log('🔍 Verificando GET /health...');
  const result = await fetchJson<HealthResponse>(`${API_URL}/health`);
  
  if (result.success && result.status === 200 && result.data) {
    console.log(`   ✅ Status: ${result.status}`);
    console.log(`   📋 Response:`);
    console.log(`      - ok: ${result.data.ok}`);
    console.log(`      - status: ${result.data.status}`);
    console.log(`      - version: ${result.data.version || 'N/A'}`);
    console.log(`      - commit: ${result.data.commit || 'N/A'}`);
    console.log(`      - environment: ${result.data.environment || 'N/A'}`);
    console.log(`      - uptime: ${result.data.uptime || 'N/A'}`);
    if (result.data.services) {
      console.log(`      - database: ${result.data.services.database || 'N/A'}`);
      console.log(`      - migrations: ${result.data.services.migrations || 'N/A'}`);
    }
    return true;
  } else {
    console.log(`   ❌ Status: ${result.status || 'error'}`);
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
    if (result.data) {
      console.log(`   📋 Response: ${JSON.stringify(result.data, null, 2)}`);
    }
    return false;
  }
}

async function verifyDeployInfo(): Promise<boolean> {
  console.log('🔍 Verificando GET /deploy-info...');
  const result = await fetchJson<DeployInfoResponse>(`${API_URL}/deploy-info`);
  
  if (result.success && result.status === 200 && result.data) {
    // Validar formato requerido
    const hasRequiredFields = 
      result.data.ok !== undefined &&
      result.data.version !== undefined &&
      result.data.commitHash !== undefined &&
      result.data.environment !== undefined &&
      result.data.timestamp !== undefined;
    
    if (!hasRequiredFields) {
      console.log(`   ❌ Formato incorrecto: faltan campos requeridos`);
      console.log(`   📋 Response: ${JSON.stringify(result.data, null, 2)}`);
      return false;
    }
    
    console.log(`   ✅ Status: ${result.status}`);
    console.log(`   📋 Response:`);
    console.log(`      - ok: ${result.data.ok}`);
    console.log(`      - version: ${result.data.version}`);
    console.log(`      - commitHash: ${result.data.commitHash}`);
    console.log(`      - environment: ${result.data.environment}`);
    console.log(`      - timestamp: ${result.data.timestamp}`);
    return true;
  } else {
    console.log(`   ❌ Status: ${result.status || 'error'}`);
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
    if (result.data) {
      console.log(`   📋 Response: ${JSON.stringify(result.data, null, 2)}`);
    }
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Railway Deployment Verification');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`Health endpoint: ${API_URL}/health`);
  console.log(`Deploy-info endpoint: ${API_URL}/deploy-info`);
  console.log('='.repeat(60));
  console.log('');
  
  let allPassed = true;
  
  // Verificación 1: Health Check
  const healthOk = await verifyHealth();
  allPassed = allPassed && healthOk;
  console.log('');
  
  // Verificación 2: Deploy Info
  const deployInfoOk = await verifyDeployInfo();
  allPassed = allPassed && deployInfoOk;
  console.log('');
  
  // Resumen
  console.log('='.repeat(60));
  if (allPassed) {
    console.log('✅ VERIFICATION PASSED');
    console.log('='.repeat(60));
    console.log('✅ GET /health responde 200 OK');
    console.log('✅ GET /deploy-info responde 200 OK con formato correcto');
    console.log('✅ Railway healthcheck debería pasar');
    console.log('='.repeat(60));
    process.exit(0);
  } else {
    console.log('❌ VERIFICATION FAILED');
    console.log('='.repeat(60));
    if (!healthOk) {
      console.log('❌ GET /health no responde 200 OK');
    }
    if (!deployInfoOk) {
      console.log('❌ GET /deploy-info no responde 200 OK o formato incorrecto');
    }
    console.log('');
    console.log('💡 Verificar:');
    console.log('   1. Railway Dashboard: Root Directory = backend');
    console.log('   2. Railway Dashboard: Healthcheck Path = /health');
    console.log('   3. Railway Dashboard: Start Command = node dist/server.js');
    console.log('   4. Railway logs para ver PORT env y errores de startup');
    console.log('   5. Verificar que /deploy-info está montado en server.ts');
    console.log('='.repeat(60));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

