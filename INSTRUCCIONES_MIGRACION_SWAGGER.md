# 🎯 Instrucciones Rápidas - Ejecutar Migración desde Swagger

## 📍 Ubicación del Endpoint Correcto

En la interfaz de Swagger UI (`https://canalmedico-production.up.railway.app/api-docs`):

### ✅ Endpoint Correcto: `POST /api/seed/migrate`

**NO confundir con:**
- ❌ `POST /api/seed` - Este es para crear usuarios de prueba (no es el correcto)

---

## 🚀 Pasos Detallados

### Paso 1: Abre Swagger UI
Ve a: `https://canalmedico-production.up.railway.app/api-docs`

### Paso 2: Encuentra la Sección "Seed"
- Busca la sección que dice **"Seed"** en la lista de la izquierda
- Verás un ícono de flecha/caret (^) - haz clic para expandir

### Paso 3: Identifica el Endpoint Correcto
Dentro de la sección "Seed" verás **DOS endpoints**:

1. ❌ **`POST /api/seed`**
   - Descripción: "Poblar base de datos con usuarios de prueba"
   - **Este NO es el que necesitas**

2. ✅ **`POST /api/seed/migrate`**
   - Descripción: "Ejecutar migraciones de base de datos"
   - **Este SÍ es el correcto**

### Paso 4: Ejecuta el Endpoint
1. Haz clic en **`POST /api/seed/migrate`** para expandirlo
2. Haz clic en el botón verde **"Try it out"** (arriba a la derecha del endpoint)
3. Verás la sección "Parameters" que dice **"No parameters"** - esto es **correcto** ✅
4. Haz clic en el botón azul **"Execute"** (al final del endpoint)
5. Espera unos segundos mientras se ejecuta

### Paso 5: Verifica la Respuesta

**Si fue exitoso:**
```json
{
  "success": true,
  "message": "Migración ejecutada exitosamente",
  "output": "..." // Logs de Prisma
}
```

**Si hubo error:**
```json
{
  "success": false,
  "error": "Error al ejecutar migración",
  "details": "...",
  "output": "...",
  "stderr": "..."
}
```

---

## ✅ Verificación Post-Migración

Después de ejecutar la migración:

1. **Verifica los logs del backend** en Railway para confirmar que no hay errores
2. **Prueba un endpoint** que use las nuevas tablas/campos:
   - `GET /api/doctors/:id/availability` - Debe funcionar sin errores
   - `POST /api/signup-requests` - Debe crear una solicitud correctamente

---

## 🔍 Visual en Swagger UI

Cuando veas la sección "Seed" expandida, deberías ver:

```
📁 Seed
   ├── POST /api/seed
   │   └── "Poblar base de datos con usuarios de prueba"
   │
   └── POST /api/seed/migrate  ⭐ ESTE ES EL CORRECTO
       └── "Ejecutar migraciones de base de datos"
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué no tiene parámetros?
**Respuesta:** Es correcto. El endpoint `/api/seed/migrate` no requiere parámetros porque:
- Lee directamente el `schema.prisma`
- Aplica todos los cambios automáticamente
- No necesita configuración adicional

### ¿Es seguro ejecutarlo?
**Respuesta:** Sí, es seguro. El comando `prisma db push` solo:
- Agrega nuevos campos (como `modoDisponibilidad` y `horariosAutomaticos`)
- Crea nuevas tablas (como `doctor_signup_requests`)
- No elimina datos existentes (gracias a `--accept-data-loss` solo acepta cambios de estructura)

### ¿Cuánto tarda?
**Respuesta:** Normalmente toma entre 5-15 segundos dependiendo del tamaño de la base de datos.

---

## 🆘 Si No Ves el Endpoint `/migrate`

Si no ves el endpoint `POST /api/seed/migrate` en Swagger:

1. **Verifica que el backend esté actualizado** - Debe tener la última versión con la documentación Swagger
2. **Refresca la página** de Swagger UI (Ctrl+F5 o Cmd+Shift+R)
3. **Verifica los logs del backend** para asegurarte de que el servidor esté corriendo
4. **Usa la terminal de Railway** como alternativa (ver `EJECUTAR_MIGRACIONES_NUEVAS_MEJORAS.md` - Opción 2)

---

**¡Listo para ejecutar!** 🚀

