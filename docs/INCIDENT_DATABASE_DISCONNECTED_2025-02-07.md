# INFORME OPERATIVO — Incidente: database: disconnected en Producción

**Fecha:** 2025-02-07  
**Rol:** Incident Response Engineer + SRE  
**Proyecto:** CanalMedico  
**Entorno:** Production (Railway)

---

## RESUMEN EJECUTIVO

El backend en Railway responde `/health` con `services.database = "disconnected"` a pesar de que `services.migrations = "completed"`. Esto provoca error 500 en POST `/api/auth/login`. El diagnóstico apunta a una desconexión entre la ejecución de migraciones (proceso hijo) y la conexión del Prisma Client en el proceso principal.

---

## FASE 1 — ANÁLISIS DEL CÓDIGO

### 1.1 Inicialización de PrismaClient

| Archivo | Ubicación | Comportamiento |
|---------|-----------|----------------|
| `backend/src/database/prisma.ts` | Líneas 3-17 | Singleton que crea `new PrismaClient()`. No hace `$connect()` explícito. Usa `env("DATABASE_URL")` vía schema de Prisma. |
| `backend/prisma/schema.prisma` | Línea 11 | `url = env("DATABASE_URL")` — Prisma lee la variable en runtime. |

### 1.2 Lógica de /health y estado de database

| Archivo | Líneas | Lógica |
|---------|--------|--------|
| `backend/src/server.ts` | 151-167 | `systemHealth.dbConnected` se inicializa en `false`. |
| `backend/src/server.ts` | 220 | `database: systemHealth.dbConnected ? 'connected' : 'disconnected'` |
| `backend/src/server.ts` | 744-756 | `prisma.$connect()` ? si OK: `dbConnected = true`; si falla: `dbConnected = false`, `status = 'degraded'`. |

### 1.3 Flujo de inicialización

```
startServer()
  ? listen() (servidor escuchando)
  ? initializeBackend() (en background)
      1. runMigrations() [execSync: npx prisma migrate deploy o db push]
         ? Si OK: systemHealth.migrationsRun = true
      2. prisma.$connect()
         ? Si OK: systemHealth.dbConnected = true
         ? Si falla: systemHealth.dbConnected = false, status = 'degraded'
```

### 1.4 Paradoja observada

- **migrations = "completed"** ? `runMigrations()` terminó sin lanzar excepción.
- **database = "disconnected"** ? `prisma.$connect()` lanzó excepción.

Las migraciones se ejecutan en un **proceso hijo** (`execSync`), el `$connect()` en el **proceso principal**. Ambos usan `process.env.DATABASE_URL`.

### 1.5 Flags de entorno

- No hay flags que desactiven la conexión a DB.
- No hay lógica por `RAILWAY_ENV` ni variables específicas que condicionen la conexión.

---

## FASE 2 — CONFIGURACIÓN ESPERADA

### Condiciones para `database = "connected"`

1. `prisma.$connect()` debe completar sin excepción.
2. `DATABASE_URL` debe estar definida y resolverse correctamente.
3. El servicio Postgres en Railway debe estar activo y accesible desde el backend.
4. Si Railway exige SSL, la URL debe incluir `?sslmode=require` o equivalente.

### Variables de entorno necesarias

| Variable | Origen esperado | Validación en código |
|----------|-----------------|----------------------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referencia Railway) | `env.ts` — requerida, debe empezar con `postgresql://` o `postgres://` |

### Estado esperado en Railway

- Plugin/servicio Postgres **conectado** al servicio backend (mismo proyecto).
- `DATABASE_URL` inyectada como **referencia** al Postgres, no como string literal.
- Postgres en estado **Running**, no pausado ni eliminado.

### Dependencias

- Backend ? plugin Postgres (variable de referencia).
- Sin binding correcto, `DATABASE_URL` puede ser literal `{{Postgres.DATABASE_URL}}` sin resolver.

---

## FASE 3 — DIAGNÓSTICO Y HIPÓTESIS

### Hipótesis ordenadas por probabilidad

| # | Causa | Probabilidad | Evidencia |
|---|-------|--------------|-----------|
| 1 | Plugin Postgres no conectado o binding roto | Alta | migrations=completed pero db=disconnected sugiere que el proceso hijo tuvo acceso (o ejecutó en build), pero el runtime falla. Si el binding está roto, `DATABASE_URL` podría ser undefined o un valor placeholder. |
| 2 | `DATABASE_URL` definida como string literal | Alta | Si se definió `{{ Postgres.DATABASE_URL }}` como texto en lugar de usar “Add Reference”, Railway no la resuelve y Prisma recibe una URL inválida. |
| 3 | Falta `sslmode=require` para Prisma Client | Media | Railway suele incluir SSL en la URL, pero Prisma Client puede comportarse distinto al CLI. Problemas conocidos: “Issue Connecting to Railway PostgreSQL via Prisma (CLI Works Fine)”. |
| 4 | Postgres pausado o eliminado | Media | Si el servicio está caído, tanto migraciones como `$connect` fallarían. migrations=completed indica que en algún momento la conexión funcionó. |
| 5 | Límite de conexiones o timeout | Baja | Posible en escenarios de carga, menos probable en arranque tras deploy. |

### Causa raíz más probable

Combinación de (1) y (2): binding incorrecto o `DATABASE_URL` definida como string literal en lugar de referencia, resultando en URL inválida o vacía para el Prisma Client en runtime.

---

## FASE 4 — ACCIONES CORRECTIVAS

### A) Acciones en Cursor (código)

#### A1. Asegurar `sslmode=require` en producción

- **Objetivo:** Evitar fallos de conexión por SSL cuando Railway lo exige.
- **Archivo:** `backend/src/config/env.ts`
- **Lógica:** Antes de que se importe `prisma`, si `NODE_ENV === 'production'` y `DATABASE_URL` no contiene `sslmode`, añadir `?sslmode=require` (o `&sslmode=require` si ya hay query params).
- **Restricción:** No modificar la base de la URL; solo agregar parámetros de conexión necesarios.

#### A2. (Opcional) Log de diagnóstico temporal

- Añadir log del prefijo de `DATABASE_URL` (por ejemplo, primeros 50 caracteres, sin password) para verificar que la variable está definida y tiene formato razonable.
- Quitar tras resolver el incidente.

### B) Acciones en Railway UI (humano)

#### B1. Verificar plugin Postgres conectado al backend

1. **Dónde:** Railway Dashboard ? Proyecto CanalMedico.
2. **Acción:** Confirmar que existe un servicio Postgres y que está vinculado al servicio backend.
3. **Cómo:** Backend ? Settings ? Variables. Debe aparecer `DATABASE_URL` como referencia al Postgres.
4. **Esperado:** `DATABASE_URL` con valor tipo `postgresql://postgres:...@...railway.internal:5432/railway`.

#### B2. Verificar definición de DATABASE_URL

1. **Dónde:** Railway Dashboard ? Servicio Backend ? Variables.
2. **Acción:** Revisar `DATABASE_URL`.
3. **Correcto:** Definida como **Reference** a Postgres (`Add Reference` ? Postgres ? DATABASE_URL).
4. **Incorrecto:** Valor literal como `{{ Postgres.DATABASE_URL }}` o `${{Postgres.DATABASE_URL}}` escrito a mano.
5. **Esperado:** La variable debe verse como referencia (ícono de enlace) y Railway debe mostrar de qué servicio proviene.

#### B3. Verificar estado del servicio Postgres

1. **Dónde:** Railway Dashboard ? Servicio Postgres.
2. **Acción:** Verificar que el estado sea **Running**.
3. **Esperado:** No pausado ni eliminado. Logs sin errores críticos.

#### B4. Reiniciar el backend tras cambios

1. **Dónde:** Railway Dashboard ? Servicio Backend.
2. **Acción:** Redeploy o Restart.
3. **Esperado:** Nuevo deploy/restart para que las variables actualizadas se apliquen.

### Orden recomendado

1. B1 ? B2 ? B3 (verificaciones en Railway).
2. A1 (cambio en código si se aprueba).
3. B4 (reinicio).
4. Verificación (Fase 5).

---

## FASE 5 — CRITERIO DE ÉXITO

El incidente se considera resuelto cuando:

| Check | Criterio |
|-------|----------|
| 1 | `GET /health` ? `services.database = "connected"` |
| 2 | `POST /api/auth/login` con credenciales válidas ? 200 OK (o 401/400 si aplica), nunca 500 |
| 3 | Logs del backend sin errores de conexión a PostgreSQL (P1001, timeout, etc.) |

### Comando de verificación

```bash
# Health
curl -s https://canalmedico-production.up.railway.app/health | jq '.services'

# Login (ajustar email/password según credenciales de prueba)
curl -s -X POST https://canalmedico-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@canalmedico.com","password":"Admin123!"}'
```

---

## EVIDENCIAS EN CÓDIGO

| Archivo | Líneas | Evidencia |
|---------|--------|-----------|
| `server.ts` | 151-167 | `systemHealth.dbConnected = false` inicial. |
| `server.ts` | 220 | Mapeo `dbConnected` ? `database: "connected"|"disconnected"`. |
| `server.ts` | 744-756 | `prisma.$connect()` y actualización de `dbConnected`. |
| `server.ts` | 719-733 | Migraciones: si `runMigrations()` termina sin throw ? `migrationsRun = true`. |
| `prisma.ts` | 3-17 | Singleton PrismaClient sin `$connect()` en creación. |
| `schema.prisma` | 11 | `url = env("DATABASE_URL")`. |
| `env.ts` | 24-25, 169-185 | Validación de `DATABASE_URL` obligatoria y formato. |
| `railway.json` | buildCommand | `prisma migrate deploy` en build; migraciones también se ejecutan en runtime en `initializeBackend()`. |

---

## CONFIRMACIÓN PARA CONTINUAR EL RELEASE

Cuando todos los checks de la Fase 5 pasen:

1. Marcar el incidente como cerrado.
2. Continuar con FASE 2.2 del checklist (usuarios de prueba, E2E, RBAC).
3. Documentar cambios realizados (variables, configuración, código).
4. Eliminar logs de diagnóstico temporales, si se añadieron.

---

**Última actualización:** 2025-02-07  
**Estado:** Pendiente de acciones correctivas
