#!/usr/bin/env node

/**
 * Script de Verificación de Health Check
 * 
 * Valida que el endpoint /health responde correctamente
 * con retry automático para Railway healthcheck
 * 
 * Uso:
 *   API_URL=http://localhost:3000 npm run verify:health
 *   API_URL=https://canalmedico-production.up.railway.app npm run verify:health
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const MAX_RETRIES = 10;
const RETRY_DELAY = 1000; // 1 segundo

interface HealthCheckResult {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  attempt: number;
}

async function fetchHealth(url: string): Promise<HealthCheckResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    
    const data = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
    
    return {
      success: response.status === 200,
      status: response.status,
      data,
      attempt: 0,
    };
  } catch (error: any) {
    return {
      success: false,
      status: 0,
      error: error.message || 'Network error',
      attempt: 0,
    };
  }
}

async function verifyHealthWithRetry(maxRetries: number = MAX_RETRIES): Promise<HealthCheckResult> {
  const healthUrl = `${API_URL}/health`;
  
  console.log('='.repeat(60));
  console.log('Health Check Verification');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`Health endpoint: ${healthUrl}`);
  console.log(`Max retries: ${maxRetries}`);
  console.log(`Retry delay: ${RETRY_DELAY}ms`);
  console.log('='.repeat(60));
  console.log('');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Attempt ${attempt}/${maxRetries}] Checking /health...`);
    
    const result = await fetchHealth(healthUrl);
    result.attempt = attempt;
    
    if (result.success) {
      console.log(`  ✅ Health check OK (Status: ${result.status})`);
      if (result.data) {
        console.log(`  📋 Response:`, JSON.stringify(result.data, null, 2));
      }
      console.log('');
      console.log('='.repeat(60));
      console.log('✅ HEALTH CHECK PASSED');
      console.log('='.repeat(60));
      return result;
    }
    
    console.log(`  ❌ Health check failed (Status: ${result.status || 'N/A'})`);
    if (result.error) {
      console.log(`  ❌ Error: ${result.error}`);
    }
    if (result.data?.error) {
      console.log(`  ❌ Response error: ${result.data.error}`);
    }
    
    if (attempt < maxRetries) {
      console.log(`  ⏳ Retrying in ${RETRY_DELAY}ms...`);
      console.log('');
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('❌ HEALTH CHECK FAILED');
  console.log('='.repeat(60));
  console.log(`All ${maxRetries} attempts failed`);
  console.log('');
  console.log('Possible causes:');
  console.log('1. Server is not listening on the specified port');
  console.log('2. Health endpoint /health is not mounted');
  console.log('3. Server is crashing during startup');
  console.log('4. Network connectivity issues');
  console.log('5. Server is still initializing (check logs)');
  console.log('');
  console.log('Troubleshooting:');
  console.log(`- Verify server logs for errors`);
  console.log(`- Check that PORT is correctly configured`);
  console.log(`- Verify that /health route is mounted before listen()`);
  console.log(`- Ensure server is listening on 0.0.0.0 (not localhost)`);
  console.log('='.repeat(60));
  
  return {
    success: false,
    status: 0,
    error: `All ${maxRetries} attempts failed`,
    attempt: maxRetries,
  };
}

async function main() {
  try {
    const result = await verifyHealthWithRetry(MAX_RETRIES);
    
    if (result.success) {
      console.log('');
      console.log('✅ Health check verification passed');
      process.exit(0);
    } else {
      console.log('');
      console.log('❌ Health check verification failed');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('');
    console.error('❌ Fatal error:', error.message || error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

