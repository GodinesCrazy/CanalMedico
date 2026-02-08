# 📖 RUNBOOK_PRODUCTION.md

**Manual de Operación en Producción**  
**Fecha:** 2025-01-XX  
**Para:** Equipo de Operaciones / SRE

---

## 🔍 DIAGNOSTICAR ERRORES

### Ver Logs en Railway
1. Ir a Railway Dashboard
2. Seleccionar servicio Backend
3. Click en "Logs"
4. Filtrar por nivel (error, warn)

### Ver Logs Locales
```bash
cd backend
tail -f logs/error.log
tail -f logs/combined.log
```

### Endpoints de Diagnóstico
- `/health` - Estado básico del servidor
- `/ready` - Estado completo (servidor + dependencias)
- `/deploy-info` - Información de deploy (versión, commit)

---

## 📊 DÓNDE MIRAR LOGS

### Railway Dashboard
- **Logs en tiempo real:** Dashboard → Servicio → Logs
- **Métricas:** Dashboard → Servicio → Metrics

### Archivos Locales
- `backend/logs/error.log` - Solo errores
- `backend/logs/combined.log` - Todos los logs

---

## 🔄 REINICIAR SERVICIOS

### Railway
1. Dashboard → Servicio → Settings
2. Click "Redeploy" o "Restart"

### Local
```bash
cd backend
npm start
```

---

## 🔐 ROTAR SECRETOS

### JWT Secrets
1. Generar nuevos secretos fuertes
2. Actualizar en Railway Variables
3. **IMPORTANTE:** Todos los usuarios deben re-login (tokens anteriores inválidos)

### API Keys
1. Regenerar en proveedor (MercadoPago, AWS, etc.)
2. Actualizar en Railway Variables
3. Redeploy servicio

---

## 🗄️ EJECUTAR MIGRACIONES MANUALES

### Railway
```bash
railway run npx prisma migrate deploy
```

### Local
```bash
cd backend
npx prisma migrate deploy
```

### Rollback
1. Ver migraciones aplicadas: `npx prisma migrate status`
2. Crear migración de rollback si es necesario
3. Aplicar migración de rollback

---

## 🚨 TROUBLESHOOTING COMÚN

### Error: "PORT not set"
**Causa:** Variable PORT no configurada en Railway  
**Solución:** Verificar Railway Variables, PORT debe estar asignado automáticamente

### Error: "Database connection failed"
**Causa:** DATABASE_URL incorrecta o DB no disponible  
**Solución:** Verificar DATABASE_URL en Railway Variables, verificar que Postgres service está corriendo

### Error: "Health check failed"
**Causa:** Servidor no responde en `/health` o `/ready`  
**Solución:** Verificar logs, asegurar que servidor está escuchando antes de healthcheck

### Error: "Migration failed"
**Causa:** Migración incompatible o DB en estado inconsistente  
**Solución:** Verificar estado de migraciones, considerar rollback

---

## 📞 CONTACTOS

- **Soporte Técnico:** soporte@canalmedico.cl
- **Documentación:** `/docs` en repo

---

**Última actualización:** 2025-01-XX

