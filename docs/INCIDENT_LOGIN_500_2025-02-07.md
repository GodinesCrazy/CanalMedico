# INFORME DE INCIDENTE — HTTP 500 en POST /api/auth/login

**Fecha:** 2025-02-07  
**Rol:** Incident Response Engineer (Auth/JWT)  
**Proyecto:** CanalMedico  
**Entorno:** Production (Railway)

---

## RESUMEN

El endpoint POST /api/auth/login devolvía HTTP 500 en todas las solicitudes (credenciales válidas e inválidas). El error bloqueaba el release. Tras el análisis, se identificaron causas probables y se aplicó un fix defensivo mínimo.

---

## FASE 1 — QUÉ BUSCAR EN LOGS (Railway ? Backend ? Logs)

| Hipótesis | Mensaje típico en logs |
|-----------|------------------------|
| Stack trace en login | `Error en login:` seguido de stack |
| Prisma P2022 (columna inexistente) | `Invalid `prisma.user.findUnique()` invocation` / `P2022` |
| Prisma P1001 (conexión) | `Can't reach database server` / `P1001` |
| bcrypt hash inválido | `data and hash arguments required` / `Illegal arguments` |
| JWT secret faltante | `secretOrPrivateKey must have a value` / `jwt must be provided` |
| Error genérico | `Error no manejado:` en error.middleware |

---

## FASE 2 — ANÁLISIS DE CÓDIGO

### Flujo de login

1. **auth.controller.ts** (líneas 98–108): `login` llama `authService.login(req.body)` y pasa errores a `next(error)`.
2. **auth.service.ts** (líneas 176–250): `login` ejecuta:
   - `prisma.user.findUnique` ? si !user ? createError 401
   - `comparePassword(plain, user.password)` ? si falla ? createError 401
   - `generateTokenPair(...)` ? JWT
3. **error.middleware.ts** (líneas 29–34): Solo errores con `isOperational && statusCode` devuelven 4xx. Cualquier otro error ? 500.

### Causas raíz identificadas

| # | Causa | Archivo | Línea | Evidencia |
|---|-------|---------|-------|-----------|
| 1 | `comparePassword` lanza cuando `user.password` es null/undefined o hash inválido | auth.service.ts | 197 | bcrypt.compare(plain, null) lanza; el error no es operacional ? 500 |
| 2 | `user.password` null por datos inconsistentes o migración | - | - | Usuario existe pero sin password válido |
| 3 | Cualquier throw no-operacional en login termina como 500 | auth.service.ts | 246–248 | El catch re-lanza sin marcar como operacional |

### Seed / Admin en producción

- **admin.ts** (líneas 64–68): En `NODE_ENV === 'production'` retorna de inmediato; no crea admin.
- **forceAdminReset**: Solo corre si `FORCE_ADMIN_PASSWORD_RESET=true` y `NODE_ENV !== 'production'`.
- Conclusión: en producción no se crea admin automáticamente. Si no hay seed manual, `admin@canalmedico.com` no existe ? `user` null ? createError 401 (correcto).
- El 500 indica que el fallo ocurre **después** de encontrar usuario (p.ej. en comparePassword o generateTokenPair) o por un error no operacional.

---

## FASE 3 — FIX APLICADO

### Cambios en `backend/src/modules/auth/auth.service.ts`

**1. Guard de password (líneas 196–200):**
```typescript
if (!user.password || typeof user.password !== 'string') {
  throw createError('Email o contraseña incorrectos', 401);
}
```

**2. try/catch alrededor de comparePassword (líneas 202–212):**
```typescript
let isPasswordValid = false;
try {
  isPasswordValid = await comparePassword(data.password, user.password);
} catch (compareErr) {
  logger.warn('Error en comparePassword (hash inválido o corrupto):', compareErr);
  throw createError('Email o contraseña incorrectos', 401);
}
```

**3. Catch global en login (líneas 256–263):**
```typescript
} catch (error: any) {
  if (error?.isOperational === true && typeof error?.statusCode === 'number') {
    throw error;
  }
  logger.error('Error en login:', error);
  throw createError('Email o contraseña incorrectos', 401);
}
```

### Principios

- Sin nuevas features.
- Sin cambios en contrato de API.
- Errores esperables (usuario no encontrado, hash inválido, etc.) devuelven 401.
- Errores operacionales se reenvían con su statusCode.
- Cualquier otro error se convierte en 401 para evitar 500 en casos no críticos.

---

## FASE 4 — VALIDACIÓN POST-DEPLOY

Tras el redeploy, comprobar:

| Caso | Request | Esperado |
|------|---------|----------|
| Credenciales válidas | POST /api/auth/login con email/password correctos | 200 OK |
| Credenciales inválidas | POST /api/auth/login con email/password incorrectos | 401 |
| Usuario inexistente | POST /api/auth/login con email no registrado | 401 |
| Body inválido | POST sin body o con JSON malformado | 400 (validación Zod) |

Comandos de verificación:
```bash
# Login con credenciales inválidas ? 401
curl -s -w "\n%{http_code}" -X POST https://canalmedico-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"wrong@test.com","password":"wrong"}'

# Login con credenciales válidas (si existen) ? 200
curl -s -w "\n%{http_code}" -X POST https://canalmedico-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"admin@canalmedico.com","password":"Admin123!"}'
```

---

## ESTADO FINAL

| Item | Estado |
|------|--------|
| Causa raíz | Fix defensivo aplicado (comparePassword + catch global) |
| Fix en código | Sí — `auth.service.ts` |
| Commit | Pendiente de commit aislado |
| Validación | Pendiente post-deploy |

---

## PRÓXIMOS PASOS

1. Commit aislado: solo `backend/src/modules/auth/auth.service.ts`.
2. Push a `main` para redeploy en Railway.
3. Validar endpoints según la tabla anterior.
4. Si login sigue con 500, revisar logs para stack trace exacto.

---

**Última actualización:** 2025-02-07
