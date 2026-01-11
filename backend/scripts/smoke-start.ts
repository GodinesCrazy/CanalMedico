#!/usr/bin/env tsx

/**
 * Smoke Test Script - Simula Railway Startup
 * 
 * Este script levanta el servidor como Railway lo haría:
 * - PORT desde env
 * - node dist/server.js
 * - Valida /healthz y /health
 * 
 * Uso:
 *   cd backend
 *   npm run build
 *   PORT=8080 npm run smoke:railway
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const PORT = process.env.PORT || '8080';
const API_URL = `http://localhost:${PORT}`;
const MAX_WAIT_MS = 30000; // 30 segundos
const RETRY_DELAY_MS = 500; // 500ms entre intentos

async function fetchHealth(endpoint: string): Promise<{ success: boolean; status: number; data?: any }> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json().catch(() => ({}));
    return { success: response.ok, status: response.status, data };
  } catch (error: any) {
    return { success: false, status: 0, data: { error: error.message } };
  }
}

async function waitForServer(): Promise<boolean> {
  console.log(`⏳ Esperando a que el servidor esté listo en ${API_URL}...`);
  console.log(`   (timeout: ${MAX_WAIT_MS / 1000}s)`);
  
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < MAX_WAIT_MS) {
    attempts++;
    const result = await fetchHealth('/healthz');
    
    if (result.success && result.status === 200) {
      console.log(`✅ Servidor listo después de ${attempts} intentos (${((Date.now() - startTime) / 1000).toFixed(1)}s)`);
      return true;
    }
    
    await setTimeout(RETRY_DELAY_MS);
  }
  
  console.log(`❌ Timeout: servidor no respondió después de ${MAX_WAIT_MS / 1000}s`);
  return false;
}

async function testEndpoints(): Promise<boolean> {
  console.log('\n🔍 Probando endpoints...\n');
  
  // Test /healthz
  console.log('1. GET /healthz');
  const healthz = await fetchHealth('/healthz');
  if (healthz.success && healthz.status === 200) {
    console.log(`   ✅ Status: ${healthz.status}`);
    console.log(`   📋 Response: ${JSON.stringify(healthz.data)}`);
  } else {
    console.log(`   ❌ Status: ${healthz.status || 'error'}`);
    console.log(`   ❌ Error: ${healthz.data?.error || 'Unknown error'}`);
    return false;
  }
  
  console.log('');
  
  // Test /health
  console.log('2. GET /health');
  const health = await fetchHealth('/health');
  if (health.success && health.status === 200) {
    console.log(`   ✅ Status: ${health.status}`);
    console.log(`   📋 Response: ${JSON.stringify(health.data, null, 2)}`);
  } else {
    console.log(`   ⚠️ Status: ${health.status || 'error'}`);
    console.log(`   ⚠️ Warning: /health no disponible (pero /healthz funciona)`);
    // No fallar si /healthz funciona
  }
  
  return true;
}

async function main() {
  console.log('='.repeat(60));
  console.log('SMOKE TEST - Railway Startup Simulation');
  console.log('='.repeat(60));
  console.log(`PORT: ${PORT}`);
  console.log(`API URL: ${API_URL}`);
  console.log(`Node version: ${process.version}`);
  console.log('='.repeat(60));
  console.log('');
  
  // Verificar que dist/server.js existe
  const fs = await import('fs');
  const path = await import('path');
  const serverPath = path.join(process.cwd(), 'dist', 'server.js');
  
  if (!fs.existsSync(serverPath)) {
    console.error('❌ ERROR: dist/server.js no existe');
    console.error('   Ejecuta: npm run build');
    process.exit(1);
  }
  
  console.log('✅ dist/server.js encontrado');
  console.log('');
  
  // Iniciar servidor
  console.log('🚀 Iniciando servidor...');
  const server = spawn('node', ['dist/server.js'], {
    env: { ...process.env, PORT },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  
  let serverOutput = '';
  server.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    // Solo mostrar logs importantes
    if (output.includes('[BOOT]') || output.includes('[DEPLOY]') || output.includes('listening')) {
      process.stdout.write(output);
    }
  });
  
  server.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  
  server.on('error', (error) => {
    console.error(`❌ Error iniciando servidor: ${error.message}`);
    process.exit(1);
  });
  
  // Esperar a que el servidor esté listo
  const serverReady = await waitForServer();
  
  if (!serverReady) {
    console.error('\n❌ SMOKE TEST FAILED: Servidor no inició correctamente');
    console.error('\n📋 Últimos logs del servidor:');
    console.error(serverOutput.split('\n').slice(-20).join('\n'));
    server.kill();
    process.exit(1);
  }
  
  // Probar endpoints
  const endpointsOk = await testEndpoints();
  
  if (!endpointsOk) {
    console.error('\n❌ SMOKE TEST FAILED: Endpoints no responden correctamente');
    server.kill();
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ SMOKE TEST PASSED');
  console.log('='.repeat(60));
  console.log('\n✅ Servidor iniciado correctamente');
  console.log('✅ /healthz responde 200 OK');
  console.log('✅ Endpoints funcionan correctamente');
  console.log('\n💡 Para detener el servidor, presiona Ctrl+C');
  
  // Mantener el proceso corriendo
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Deteniendo servidor...');
    server.kill();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

