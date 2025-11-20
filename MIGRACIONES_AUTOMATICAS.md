# Migraciones Automáticas en Railway

## ✅ Implementación Completada

He automatizado la ejecución de las migraciones de Prisma para que se ejecuten automáticamente cada vez que el servidor inicia en Railway.

## 🔧 Cambios Realizados

### 1. **Modificación de `backend/src/server.ts`**

Agregué una función `runMigrations()` que se ejecuta automáticamente antes de iniciar el servidor:

- ✅ Ejecuta `npx prisma migrate deploy` automáticamente
- ✅ Conecta a la base de datos antes de iniciar el servidor
- ✅ Maneja errores apropiadamente
- ✅ En producción, el servidor no inicia si las migraciones fallan
- ✅ En desarrollo, continúa con advertencias

### 2. **Script Adicional en `backend/package.json`**

Agregué un script alternativo `start:migrate` por si necesitas ejecutarlo manualmente:

```json
"start:migrate": "npx prisma migrate deploy && node dist/server.js"
```

## 🚀 Cómo Funciona

1. **Al desplegar en Railway:**
   - Railway ejecuta el build (compila TypeScript)
   - Railway inicia el servidor con `node dist/server.js`
   - El servidor automáticamente ejecuta `runMigrations()`
   - Las migraciones se aplican a la base de datos
   - El servidor inicia normalmente

2. **Orden de Ejecución:**
   ```
   Inicio del servidor
   ↓
   Ejecutar migraciones (runMigrations)
   ↓
   Conectar a la base de datos
   ↓
   Iniciar servidor HTTP
   ```

## 📋 Verificación

Para verificar que las migraciones se ejecutaron correctamente:

1. **Ver logs de Railway:**
   - Ve a Railway → Servicio `CanalMedico` → Deploy Logs
   - Busca: `🔄 Ejecutando migraciones de la base de datos...`
   - Busca: `✅ Migraciones ejecutadas correctamente`

2. **Verificar tablas en la base de datos:**
   - Usa Prisma Studio: `npx prisma studio`
   - O conecta directamente a PostgreSQL desde Railway

## ⚠️ Notas Importantes

- **Primera vez:** Las migraciones crearán todas las tablas necesarias
- **Actualizaciones:** Cualquier nueva migración se aplicará automáticamente
- **Errores:** Si las migraciones fallan en producción, el servidor no iniciará
- **Desarrollo:** En modo desarrollo, el servidor continúa aunque las migraciones fallen (con advertencias)

## 🔍 Próximos Pasos

1. **Railway desplegará automáticamente** el nuevo código desde GitHub
2. **Las migraciones se ejecutarán automáticamente** al iniciar el servidor
3. **Verifica los logs** para confirmar que todo funcionó correctamente
4. **Prueba el API** para confirmar que las tablas existen y funcionan

## 📝 Logs Esperados

Cuando todo funcione correctamente, deberías ver en los logs de Railway:

```
🔄 Ejecutando migraciones de la base de datos...
Prisma Migrate applied: migration_name
✅ Migraciones ejecutadas correctamente
✅ Conexión a la base de datos establecida
🚀 Servidor corriendo en puerto 8080
📚 Documentación API disponible en https://...
🌍 Ambiente: production
```

## 🆘 Si Algo Sale Mal

Si las migraciones fallan:

1. **Revisa los logs** para ver el error específico
2. **Verifica `DATABASE_URL`** en Railway está configurada correctamente
3. **Asegúrate** de que el servicio de PostgreSQL esté funcionando
4. **Verifica** que las migraciones en `backend/prisma/migrations` sean válidas

## ✅ Estado Actual

- ✅ Código actualizado y pusheado a GitHub
- ✅ Railway desplegará automáticamente el nuevo código
- ✅ Las migraciones se ejecutarán automáticamente al iniciar el servidor
- ✅ No necesitas ejecutar migraciones manualmente

---

**Fecha de implementación:** $(date)
**Estado:** ✅ Completado y desplegado

