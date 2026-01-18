#!/usr/bin/env node

/**
 * Script de Smoke Test para WhatsApp Cloud API
 * 
 * Ejecuta pruebas automáticas para verificar que el sistema
 * de WhatsApp está funcionando correctamente:
 * 1. Validar que GET /api/whatsapp/webhook responde al challenge
 * 2. Validar que POST /api/whatsapp/send/text funciona (requiere número de prueba)
 * 
 * Uso:
 *   npm run whatsapp:test
 *   
 * Variables de entorno requeridas:
 *   - API_URL: URL del backend (default: http://localhost:3000)
 *   - INTERNAL_API_KEY: Secret para autenticar endpoints de envío
 *   - WHATSAPP_TEST_TO: Número de teléfono para pruebas (opcional, formato: 56912345678)
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const WHATSAPP_TEST_TO = process.env.WHATSAPP_TEST_TO;
const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'canalmedico_verify_2026';

interface TestResult {
  name: string;
  success: boolean;
  status?: number;
  data?: any;
  error?: string;
}

const results: TestResult[] = [];

function logTest(name: string, success: boolean, details?: any) {
  const icon = success ? '?' : '?';
  console.log(`${icon} ${name}`);
  if (details) {
    console.log(`   ${JSON.stringify(details, null, 2).split('\n').join('\n   ')}`);
  }
  results.push({ name, success, ...details });
}

/**
 * Test 1: Validar GET /api/whatsapp/webhook (challenge)
 */
async function testWebhookChallenge(): Promise<boolean> {
  console.log('\n?? Test 1: Validar GET /api/whatsapp/webhook (challenge)');
  console.log('?'.repeat(60));

  try {
    const challenge = 'test_challenge_123456789';
    const url = `${API_URL}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=${challenge}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
      signal: AbortSignal.timeout(5000),
    });

    const responseText = await response.text();

    if (response.status === 200 && responseText === challenge) {
      logTest('GET /api/whatsapp/webhook', true, {
        status: response.status,
        challenge: 'matched',
      });
      return true;
    } else {
      logTest('GET /api/whatsapp/webhook', false, {
        status: response.status,
        expectedChallenge: challenge,
        receivedResponse: responseText.substring(0, 100),
        error: 'Challenge no coincide o status incorrecto',
      });
      return false;
    }
  } catch (error: any) {
    logTest('GET /api/whatsapp/webhook', false, {
      error: error.message || 'Network error',
    });
    return false;
  }
}

/**
 * Test 2: Validar POST /api/whatsapp/send/text
 * Solo se ejecuta si INTERNAL_API_KEY y WHATSAPP_TEST_TO están configurados
 */
async function testSendTextMessage(): Promise<boolean> {
  console.log('\n?? Test 2: Validar POST /api/whatsapp/send/text');
  console.log('?'.repeat(60));

  if (!INTERNAL_API_KEY) {
    logTest('POST /api/whatsapp/send/text', false, {
      skipped: true,
      reason: 'INTERNAL_API_KEY no configurado (requerido para este test)',
    });
    return false;
  }

  if (!WHATSAPP_TEST_TO) {
    logTest('POST /api/whatsapp/send/text', false, {
      skipped: true,
      reason: 'WHATSAPP_TEST_TO no configurado (requerido para este test)',
      hint: 'Configura WHATSAPP_TEST_TO con un número de prueba (ej: 56912345678)',
    });
    return false;
  }

  try {
    const url = `${API_URL}/api/whatsapp/send/text`;
    const testMessage = `?? Test de WhatsApp - ${new Date().toISOString()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': INTERNAL_API_KEY,
      },
      body: JSON.stringify({
        to: WHATSAPP_TEST_TO,
        text: testMessage,
      }),
      signal: AbortSignal.timeout(15000), // 15s timeout (API puede tardar)
    });

    const responseData = await response.json();

    if (response.status === 200 && responseData.success && responseData.data?.messageId) {
      logTest('POST /api/whatsapp/send/text', true, {
        status: response.status,
        messageId: responseData.data.messageId,
        to: WHATSAPP_TEST_TO,
      });
      return true;
    } else {
      logTest('POST /api/whatsapp/send/text', false, {
        status: response.status,
        response: responseData,
        error: 'Respuesta no exitosa o sin messageId',
      });
      return false;
    }
  } catch (error: any) {
    logTest('POST /api/whatsapp/send/text', false, {
      error: error.message || 'Network error',
    });
    return false;
  }
}

/**
 * Test 3: Validar POST /api/whatsapp/send/text sin autenticación (debe fallar)
 */
async function testSendTextMessageUnauthorized(): Promise<boolean> {
  console.log('\n?? Test 3: Validar que POST /api/whatsapp/send/text requiere autenticación');
  console.log('?'.repeat(60));

  try {
    const url = `${API_URL}/api/whatsapp/send/text`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Sin X-Internal-Secret header
      },
      body: JSON.stringify({
        to: '56912345678',
        text: 'Test message',
      }),
      signal: AbortSignal.timeout(5000),
    });

    const responseData = await response.json().catch(() => ({}));

    // Debe retornar 401 o 403 (no autorizado)
    if (response.status === 401 || response.status === 403) {
      logTest('POST /api/whatsapp/send/text (sin auth)', true, {
        status: response.status,
        expected: '401/403 (no autorizado)',
        message: 'Endpoint protegido correctamente',
      });
      return true;
    } else {
      logTest('POST /api/whatsapp/send/text (sin auth)', false, {
        status: response.status,
        expected: '401/403',
        error: 'Endpoint no está protegido correctamente',
        response: responseData,
      });
      return false;
    }
  } catch (error: any) {
    logTest('POST /api/whatsapp/send/text (sin auth)', false, {
      error: error.message || 'Network error',
    });
    return false;
  }
}

async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('WhatsApp Cloud API - Smoke Test');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`INTERNAL_API_KEY: ${INTERNAL_API_KEY ? '? Configurado' : '? No configurado'}`);
  console.log(`WHATSAPP_TEST_TO: ${WHATSAPP_TEST_TO || '? No configurado (test de envío será skip)'}`);
  console.log(`VERIFY_TOKEN: ${VERIFY_TOKEN ? '? Configurado' : '? No configurado'}`);
  console.log('='.repeat(60));

  // Ejecutar tests
  const test1 = await testWebhookChallenge();
  const test2 = await testSendTextMessage();
  const test3 = await testSendTextMessageUnauthorized();

  // Resumen
  console.log('');
  console.log('='.repeat(60));
  console.log('?? Resumen de Tests');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.success ? '?' : '?';
    const skip = result.data?.skipped ? ' (SKIPPED)' : '';
    console.log(`${icon} ${result.name}${skip}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('');
  console.log(`Total: ${total} | ? Passed: ${passed} | ? Failed: ${failed}`);

  if (failed === 0) {
    console.log('');
    console.log('='.repeat(60));
    console.log('? TODOS LOS TESTS PASARON');
    console.log('='.repeat(60));
    console.log('');
    console.log('El sistema de WhatsApp está funcionando correctamente.');
    console.log('');
    process.exit(0);
  } else {
    console.log('');
    console.log('='.repeat(60));
    console.log('? ALGUNOS TESTS FALLARON');
    console.log('='.repeat(60));
    console.log('');
    console.log('Revisa los errores arriba y verifica:');
    console.log('1. Variables de entorno configuradas correctamente');
    console.log('2. Servidor está corriendo y accesible');
    console.log('3. WhatsApp Cloud API está configurado en Meta Dashboard');
    console.log('4. INTERNAL_API_KEY está configurado si quieres probar envío');
    console.log('');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('');
  console.error('? Error fatal:', error);
  process.exit(1);
});
