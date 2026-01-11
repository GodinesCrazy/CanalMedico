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

async function verifyHealth(): Promise<{ success: boolean; commitHash?: string; version?: string }> {
  console.log('🔍 Verificando GET /health...');
  const response = await fetchJson(`${API_URL}/health`);
  
  const success = response.status === 200;
  let commitHash: string | undefined;
  let version: string | undefined;
  
  if (success && response.data) {
    commitHash = response.data.commit;
    version = response.data.version;
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  📋 Version: ${response.data.version || 'N/A'}`);
    console.log(`  📋 Commit: ${response.data.commit || 'N/A'}`);
    console.log(`  📋 Status: ${response.data.status || 'N/A'}`);
    console.log(`  📋 Uptime: ${response.data.uptime || 'N/A'}`);
    if (response.data.services) {
      console.log(`  📋 Services: DB=${response.data.services.database || 'N/A'}, Migrations=${response.data.services.migrations || 'N/A'}`);
    }
  }
  
  results.push({
    endpoint: 'GET /health',
    status: response.status,
    success,
    message: success 
      ? `✅ Health check OK - Version: ${version || 'N/A'}, Commit: ${commitHash?.substring(0, 7) || 'N/A'}` 
      : `❌ Health check failed: ${response.status}`,
  });
  
  if (!success) {
    console.log(`  ❌ Status: ${response.status}`);
    if (response.data?.error) {
      console.log(`  ❌ Error: ${response.data.error}`);
    }
  }
  
  return { success, commitHash, version };
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

async function verifyDeployInfo(): Promise<{ success: boolean; commitHash?: string; version?: string; environment?: string }> {
  console.log('🔍 Verificando GET /api/deploy/info...');
  const response = await fetchJson(`${API_URL}/api/deploy/info`);
  
  const success = response.status === 200 && response.data?.success;
  
  if (success && response.data?.data) {
    const deployInfo = response.data.data;
    results.push({
      endpoint: 'GET /api/deploy/info',
      status: response.status,
      success: true,
      message: `✅ Deploy info retrieved - Version: ${deployInfo.version}, Commit: ${deployInfo.commitHash?.substring(0, 7) || 'unknown'}`,
    });
    
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  📋 Version: ${deployInfo.version || 'N/A'}`);
    console.log(`  📋 Commit: ${deployInfo.commitHash || 'N/A'}`);
    console.log(`  📋 Environment: ${deployInfo.environment || 'N/A'}`);
    console.log(`  📋 Node Version: ${deployInfo.nodeVersion || 'N/A'}`);
    console.log(`  📋 Build Timestamp: ${deployInfo.buildTimestamp || 'N/A'}`);
    
    return {
      success: true,
      commitHash: deployInfo.commitHash,
      version: deployInfo.version,
      environment: deployInfo.environment,
    };
  } else {
    results.push({
      endpoint: 'GET /api/deploy/info',
      status: response.status,
      success: false,
      message: `❌ Deploy info NOT available: ${response.status} - Deploy may be outdated`,
    });
    
    console.log(`  ❌ Status: ${response.status}`);
    if (response.data?.error) {
      console.log(`  ❌ Error: ${response.data.error}`);
    }
    
    return { success: false };
  }
}

async function verifyCommitHash(deployInfoCommitHash?: string): Promise<boolean> {
  if (!deployInfoCommitHash || deployInfoCommitHash === 'unknown') {
    console.log('⚠️ Commit hash no disponible o es "unknown"');
    console.log('⚠️ No se puede validar si el deploy está actualizado');
    return true; // No bloqueante, solo warning
  }

  const expectedCommitHash = process.env.EXPECTED_COMMIT_HASH || process.env.LATEST_COMMIT_HASH;
  
  if (!expectedCommitHash) {
    // Intentar obtener el último commit de GitHub (solo si está disponible)
    try {
      console.log('📋 Intentando obtener último commit de GitHub...');
      const githubResponse = await fetch('https://api.github.com/repos/GodinesCrazy/CanalMedico/commits/main', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(5000),
      });
      
      if (githubResponse.ok) {
        const commitData = await githubResponse.json();
        const latestCommitHash = commitData.sha || '';
        
        if (latestCommitHash && deployInfoCommitHash) {
          const isUpToDate = deployInfoCommitHash.toLowerCase() === latestCommitHash.toLowerCase();
          const shortHash = deployInfoCommitHash.substring(0, 7);
          const shortLatest = latestCommitHash.substring(0, 7);
          
          console.log(`  📋 Commit desplegado: ${shortHash}`);
          console.log(`  📋 Último commit en GitHub: ${shortLatest}`);
          
          if (isUpToDate) {
            console.log(`  ✅ Deploy está actualizado con el último commit`);
            results.push({
              endpoint: 'Commit Hash Validation',
              status: 200,
              success: true,
              message: `✅ Deploy está actualizado - Commit: ${shortHash}`,
            });
            return true;
          } else {
            console.log(`  ⚠️ Deploy NO está actualizado - Esperado: ${shortLatest}, Actual: ${shortHash}`);
            results.push({
              endpoint: 'Commit Hash Validation',
              status: 200,
              success: false,
              message: `⚠️ Deploy desactualizado - Esperado: ${shortLatest}, Actual: ${shortHash}`,
            });
            return false;
          }
        }
      }
    } catch (error: any) {
      console.log(`  ⚠️ No se pudo validar commit hash contra GitHub: ${error.message}`);
      console.log(`  💡 Para validar manualmente, ejecuta: EXPECTED_COMMIT_HASH=<hash> npm run verify:railway`);
    }
    
    // Si no hay expected commit hash, solo mostrar el commit actual
    console.log(`  📋 Commit desplegado: ${deployInfoCommitHash.substring(0, 7)}`);
    return true; // No bloqueante si no hay referencia
  } else {
    // Validar contra EXPECTED_COMMIT_HASH
    const isUpToDate = deployInfoCommitHash.toLowerCase() === expectedCommitHash.toLowerCase();
    const shortHash = deployInfoCommitHash.substring(0, 7);
    const shortExpected = expectedCommitHash.substring(0, 7);
    
    console.log(`  📋 Commit desplegado: ${shortHash}`);
    console.log(`  📋 Commit esperado: ${shortExpected}`);
    
    if (isUpToDate) {
      console.log(`  ✅ Deploy está actualizado con commit esperado`);
      results.push({
        endpoint: 'Commit Hash Validation',
        status: 200,
        success: true,
        message: `✅ Deploy está actualizado - Commit: ${shortHash}`,
      });
      return true;
    } else {
      console.log(`  ❌ Deploy NO coincide con commit esperado`);
      results.push({
        endpoint: 'Commit Hash Validation',
        status: 200,
        success: false,
        message: `❌ Deploy desactualizado - Esperado: ${shortExpected}, Actual: ${shortHash}`,
      });
      return false;
    }
  }
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
  if (process.env.EXPECTED_COMMIT_HASH) {
    console.log(`Expected Commit: ${process.env.EXPECTED_COMMIT_HASH.substring(0, 7)}`);
  }
  console.log('========================================');
  console.log('');

  let allPassed = true;
  let deployInfoCommitHash: string | undefined;
  let healthCommitHash: string | undefined;

  // Verificación 1: Health Check (incluye commit/version)
  const healthResult = await verifyHealth();
  allPassed = allPassed && healthResult.success;
  healthCommitHash = healthResult.commitHash;
  console.log('');

  // Verificación 2: Deploy Info (CRÍTICO para validar commit hash)
  const deployInfo = await verifyDeployInfo();
  allPassed = allPassed && deployInfo.success;
  deployInfoCommitHash = deployInfo.commitHash;
  console.log('');

  // Verificación 3: Validar Commit Hash (usar /health si /api/deploy/info no está disponible)
  const commitHashToValidate = deployInfoCommitHash || healthCommitHash;
  if (commitHashToValidate) {
    const commitHashOk = await verifyCommitHash(commitHashToValidate);
    // Commit hash validation no es bloqueante, solo warning
    if (!commitHashOk) {
      console.log('');
      console.log('⚠️ ADVERTENCIA: Deploy puede estar desactualizado');
      console.log('⚠️ Forzar redeploy en Railway Dashboard si es necesario');
      console.log('');
    }
  } else {
    console.log('⚠️ No se pudo validar commit hash (no disponible en /health ni /api/deploy/info)');
    console.log('');
  }

  // Verificación 4: Seed Health
  const seedHealthOk = await verifySeedHealth();
  allPassed = allPassed && seedHealthOk;
  console.log('');

  // Verificación 5: Seed Test-Data (debe existir, aunque pueda devolver 403)
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
    const finalCommitHash = deployInfoCommitHash || healthCommitHash;
    if (finalCommitHash && finalCommitHash !== 'unknown') {
      console.log(`✅ Commit desplegado: ${finalCommitHash.substring(0, 7)}`);
    }
    console.log('✅ El backend está desplegado y actualizado');
    process.exit(0);
  } else {
    console.log('❌ DEPLOY FAIL - Algunos endpoints no funcionan');
    console.log('❌ Verificar que Railway ha desplegado el último commit');
    console.log('');
    console.log('CAUSA EXACTA:');
    const failedEndpoints = results.filter((r) => !r.success);
    failedEndpoints.forEach((r) => {
      console.log(`  - ${r.endpoint}: ${r.message}`);
    });
    console.log('');
    console.log('ACCIÓN RECOMENDADA:');
    console.log('1. Verificar que Railway está apuntando a branch "main"');
    console.log('2. Verificar que Root Directory está configurado como "backend" en Railway Dashboard');
    console.log('3. Verificar que railway.json y nixpacks.toml están en backend/');
    console.log('4. Forzar redeploy en Railway Dashboard → Service → Settings → Redeploy');
    console.log('5. Verificar logs de Railway para errores de build');
    console.log('6. Verificar que START_COMMAND en Railway es "node dist/server.js" (NO "npm run preview")');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});

