#!/usr/bin/env node

/**
 * Script de Smoke Test para WhatsApp Cloud API
 * 
 * Ejecuta pruebas autom?ticas para verificar que el sistema
 * de WhatsApp est? funcionando correctamente:
 * 1. Validar que GET /api/whatsapp/webhook responde al challenge
 * 2. Validar que POST /api/whatsapp/send/text funciona (requiere n?mero de prueba)
 * 
 * Uso:
 *   npm run whatsapp:test
 *   
 * Variables de entorno requeridas:
 *   - API_URL: URL del backend (default: http://localhost:3000)
 *   - INTERNAL_API_KEY: Secret para autenticar endpoints de env?o
 *   - WHATSAPP_TEST_TO: N?mero de tel?fono para pruebas (opcional, formato: 56912345678)
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
  const icon = success ? '[OK]' : details?.skipped ? '[SKIP]' : '[FAIL]';
  console.log(`${icon} ${name}`);
  if (details) {
    console.log(`   ${JSON.stringify(details, null, 2).split('\n').join('\n   ')}`);
  }
  results.push({ name, success, ...details });
}

/**
 * Test 1: Validar GET /api/whatsapp/webhook (challenge) con token v?lido
 */
async function testWebhookChallenge(): Promise<boolean> {
  console.log('\n[TEST 1] Validar GET /api/whatsapp/webhook (challenge - token v?lido)');
  console.log('-'.repeat(60));

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
      logTest('GET /api/whatsapp/webhook (token v?lido)', true, {
        status: response.status,
        challenge: 'matched',
      });
      return true;
    } else {
      logTest('GET /api/whatsapp/webhook (token v?lido)', false, {
        status: response.status,
        expectedChallenge: challenge,
        receivedResponse: responseText.substring(0, 100),
        error: 'Challenge no coincide o status incorrecto',
      });
      return false;
    }
  } catch (error: any) {
    logTest('GET /api/whatsapp/webhook (token v?lido)', false, {
      error: error.message || 'Network error',
    });
    return false;
  }
}

/**
 * Test 1b: Validar GET /api/whatsapp/webhook con token inv?lido (debe retornar 403)
 */
async function testWebhookChallengeInvalidToken(): Promise<boolean> {
  console.log('\n[TEST 1b] Validar GET /api/whatsapp/webhook (challenge - token inv?lido -> 403)');
  console.log('-'.repeat(60));

  try {
    const challenge = 'test_challenge_123456789';
    const invalidToken = 'invalid_token_12345';
    const url = `${API_URL}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${invalidToken}&hub.challenge=${challenge}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
      signal: AbortSignal.timeout(5000),
    });

    const responseText = await response.text();

    // Debe retornar 403 Forbidden con token inv?lido
    if (response.status === 403 && responseText === 'Forbidden') {
      logTest('GET /api/whatsapp/webhook (token inv?lido)', true, {
        status: response.status,
        expected: '403 Forbidden',
        message: 'Webhook correctamente protegido',
      });
      return true;
    } else {
      logTest('GET /api/whatsapp/webhook (token inv?lido)', false, {
        status: response.status,
        expected: '403 Forbidden',
        receivedResponse: responseText.substring(0, 100),
        error: 'No retorn? 403 con token inv?lido',
      });
      return false;
    }
  } catch (error: any) {
    logTest('GET /api/whatsapp/webhook (token inv?lido)', false, {
      error: error.message || 'Network error',
    });
    return false;
  }
}

/**
 * Test 2: Validar POST /api/whatsapp/send/text
 * Solo se ejecuta si INTERNAL_API_KEY y WHATSAPP_TEST_TO est?n configurados
 */
async function testSendTextMessage(): Promise<boolean> {
  console.log('\n[TEST 2] Validar POST /api/whatsapp/send/text');
  console.log('-'.repeat(60));

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
      hint: 'Configura WHATSAPP_TEST_TO con un n?mero de prueba (ej: 56912345678)',
    });
    return false;
  }

  try {
    const url = `${API_URL}/api/whatsapp/send/text`;
    const testMessage = `[TEST] Test de WhatsApp - ${new Date().toISOString()}`;

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
 * Test 3: Validar POST /api/whatsapp/send/text sin autenticaci?n (debe fallar)
 */
async function testSendTextMessageUnauthorized(): Promise<boolean> {
  console.log('\n[TEST 3] Validar que POST /api/whatsapp/send/text requiere autenticación');
  console.log('-'.repeat(60));

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
        error: 'Endpoint no est? protegido correctamente',
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

/**
 * Test 0: Verificar health endpoint
 */
async function testHealth(): Promise<boolean> {
  console.log('\n[TEST 0] Verificar /health endpoint');
  console.log('-'.repeat(60));

  try {
    const url = `${API_URL}/health`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    const responseData = await response.json().catch(() => ({}));

    if (response.status === 200) {
      logTest('GET /health', true, {
        status: response.status,
        data: responseData,
      });
      return true;
    } else {
      logTest('GET /health', false, {
        status: response.status,
        error: 'Health check failed',
        data: responseData,
      });
      return false;
    }
  } catch (error: any) {
    logTest('GET /health', false, {
      error: error.message || 'Network error',
    });
    return false;
  }
}

/**
 * Test 0b: Verificar status del módulo WhatsApp
 */
async function testModuleStatus(): Promise<boolean> {
  console.log('\n[TEST 0b] Verificar estado del módulo WhatsApp (/api/whatsapp/status)');
  console.log('-'.repeat(60));

  if (!INTERNAL_API_KEY) {
    logTest('GET /api/whatsapp/status', false, {
      skipped: true,
      reason: 'INTERNAL_API_KEY no configurado (requerido para este test)',
    });
    return false;
  }

  try {
    const url = `${API_URL}/api/whatsapp/status`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': INTERNAL_API_KEY,
      },
      signal: AbortSignal.timeout(5000),
    });

    const responseData = await response.json();

    if (response.status === 200 && responseData.success && responseData.data) {
      const status = responseData.data;
      logTest('GET /api/whatsapp/status', true, {
        status: response.status,
        moduleLoaded: status.moduleLoaded,
        fallbackActive: status.fallbackActive,
        enableFlag: status.enableFlag,
        verifyTokenSet: status.verifyTokenSet,
        phoneNumberIdSet: status.phoneNumberIdSet,
        wabaIdSet: status.wabaIdSet,
        tokenSet: status.tokenSet,
      });

      // Advertir si está en fallback
      if (status.fallbackActive) {
        console.log('   ⚠️  ADVERTENCIA: Módulo WhatsApp está usando fallback handler');
        console.log('   ⚠️  Esto significa que el módulo real no se cargó correctamente');
      }

      return true;
    } else {
      logTest('GET /api/whatsapp/status', false, {
        status: response.status,
        response: responseData,
        error: 'Respuesta no exitosa o sin data',
      });
      return false;
    }
  } catch (error: any) {
    logTest('GET /api/whatsapp/status', false, {
      error: error.message || 'Network error',
    });
    return false;
  }
}

/**
 * Test 2b: POST webhook fake (simular mensaje de Meta)
 */
async function testPostWebhookFake(): Promise<boolean> {
  console.log('\n[TEST 2b] Validar POST /api/whatsapp/webhook (simulación)');
  console.log('-'.repeat(60));

  try {
    const url = `${API_URL}/api/whatsapp/webhook`;
    const fakePayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test_entry_id',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '56912345678',
              phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || 'test_phone_id',
            },
          },
          field: 'messages',
        }],
      }],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': 'sha256=fake_signature_for_test', // Fake signature
      },
      body: JSON.stringify(fakePayload),
      signal: AbortSignal.timeout(5000),
    });

    const responseData = await response.json().catch(() => ({}));

    // Debe responder 200 OK (incluso si la signature es inválida, para no recibir reintentos)
    if (response.status === 200) {
      logTest('POST /api/whatsapp/webhook (fake)', true, {
        status: response.status,
        response: responseData,
        message: 'Webhook responde correctamente (puede rechazar por signature inválida)',
      });
      return true;
    } else {
      logTest('POST /api/whatsapp/webhook (fake)', false, {
        status: response.status,
        response: responseData,
        error: 'Webhook no respondió 200 OK',
      });
      return false;
    }
  } catch (error: any) {
    logTest('POST /api/whatsapp/webhook (fake)', false, {
      error: error.message || 'Network error',
    });
    return false;
  }
}

/**
 * Test 4: Validar env?o directo a Meta Graph API (opcional - requiere credenciales)
 * Este test valida que el token y permisos funcionan directamente con Meta
 */
async function testMetaGraphAPIDirect(): Promise<boolean> {
  console.log('\n[TEST 4] Validar env?o directo a Meta Graph API (opcional)');
  console.log('-'.repeat(60));

  const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    logTest('Meta Graph API Direct Test', false, {
      skipped: true,
      reason: 'WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID no configurados',
      hint: 'Configura estas variables para probar env?o directo a Meta',
    });
    return false;
  }

  if (!WHATSAPP_TEST_TO) {
    logTest('Meta Graph API Direct Test', false, {
      skipped: true,
      reason: 'WHATSAPP_TEST_TO no configurado',
      hint: 'Configura WHATSAPP_TEST_TO para probar env?o real',
    });
    return false;
  }

  try {
    // Solo validar que el token es accesible (no enviar mensaje real)
    // Hacer una llamada GET a la API de Meta para verificar permisos
    const metaApiUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}`;
    
    const response = await fetch(metaApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    const responseData = await response.json();

    if (response.status === 200 && responseData.id) {
      logTest('Meta Graph API Direct Test (token validation)', true, {
        status: response.status,
        phoneNumberId: responseData.id,
        message: 'Token v?lido y accesible',
      });
      return true;
    } else if (response.status === 401 || response.status === 403) {
      logTest('Meta Graph API Direct Test (token validation)', false, {
        status: response.status,
        error: 'Token inv?lido o sin permisos',
        response: responseData,
      });
      return false;
    } else {
      logTest('Meta Graph API Direct Test (token validation)', false, {
        status: response.status,
        response: responseData,
        error: 'Respuesta inesperada de Meta API',
      });
      return false;
    }
  } catch (error: any) {
    logTest('Meta Graph API Direct Test (token validation)', false, {
      error: error.message || 'Network error',
    });
    return false;
  }
}

async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('WhatsApp Cloud API - Smoke Test End-to-End');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`INTERNAL_API_KEY: ${INTERNAL_API_KEY ? '[OK] Configurado' : '[SKIP] No configurado'}`);
  console.log(`WHATSAPP_TEST_TO: ${WHATSAPP_TEST_TO || '[SKIP] No configurado (test de envío será skip)'}`);
  console.log(`VERIFY_TOKEN: ${VERIFY_TOKEN ? '[OK] Configurado' : '[SKIP] No configurado'}`);
  console.log(`WHATSAPP_ACCESS_TOKEN: ${process.env.WHATSAPP_ACCESS_TOKEN ? '[OK] Configurado' : '[SKIP] No configurado'}`);
  console.log(`WHATSAPP_PHONE_NUMBER_ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID ? '[OK] Configurado' : '[SKIP] No configurado'}`);
  console.log('='.repeat(60));

  // Ejecutar tests en orden
  const test0 = await testHealth();
  const test0b = await testModuleStatus();
  const test1 = await testWebhookChallenge();
  const test1b = await testWebhookChallengeInvalidToken();
  const test2b = await testPostWebhookFake();
  const test2 = await testSendTextMessage();
  const test3 = await testSendTextMessageUnauthorized();
  const test4 = await testMetaGraphAPIDirect();

  // Resumen
  console.log('');
  console.log('='.repeat(60));
  console.log('[RESUMEN] Resultados de Tests');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success && !r.data?.skipped).length;
  const skipped = results.filter(r => r.data?.skipped).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.success ? '[OK]' : result.data?.skipped ? '[SKIP]' : '[FAIL]';
    console.log(`${icon} ${result.name}`);
    if (result.error && !result.data?.skipped) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.data?.skipped) {
      console.log(`   Raz�n: ${result.data.reason || 'No configurado'}`);
      if (result.data.hint) {
        console.log(`   Hint: ${result.data.hint}`);
      }
    }
  });

  console.log('');
  console.log(`Total: ${total} | [OK] Passed: ${passed} | [FAIL] Failed: ${failed} | [SKIP] Skipped: ${skipped}`);

  // Solo considerar failed si hay tests que fallaron (no skipped)
  if (failed === 0) {
    console.log('');
    console.log('='.repeat(60));
    console.log('[SUCCESS] TODOS LOS TESTS PASARON');
    console.log('='.repeat(60));
    console.log('');
    console.log('El sistema de WhatsApp est? funcionando correctamente.');
    console.log('');
    process.exit(0);
  } else {
    console.log('');
    console.log('='.repeat(60));
    console.log('[ERROR] ALGUNOS TESTS FALLARON');
    console.log('='.repeat(60));
    console.log('');
    console.log('Revisa los errores arriba y verifica:');
    console.log('1. Variables de entorno configuradas correctamente');
    console.log('2. Servidor est? corriendo y accesible');
    console.log('3. WhatsApp Cloud API est? configurado en Meta Dashboard');
    console.log('4. INTERNAL_API_KEY est? configurado si quieres probar env?o');
    console.log('');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('');
  console.error('[FATAL] Error fatal:', error);
  process.exit(1);
});
