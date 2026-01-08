# 🔐 Ejecutar Seed para Crear Usuario ADMIN de Pruebas

## Opción 1: Ejecutar en Railway (Recomendado)

### Desde Railway Dashboard:

1. Ve a tu proyecto en Railway: https://railway.app
2. Selecciona el servicio **backend**
3. Ve a la pestaña **"Deployments"** o **"Logs"**
4. Haz clic en **"Open Shell"** o **"Open Terminal"**
5. Ejecuta el comando:

```bash
npm run prisma:seed
```

### Desde Railway CLI:

```bash
railway run --service backend npm run prisma:seed
```

## Opción 2: Script Directo (Alternativa)

Si prefieres ejecutar solo el script de admin:

```bash
# En Railway Shell:
npx tsx scripts/create-admin-test.ts
```

## Credenciales Creadas

Una vez ejecutado, podrás iniciar sesión con:

- **URL**: https://canalmedico-web-production.up.railway.app/login
- **Email**: admin@canalmedico.test
- **Password**: Admin123!
- **Rol**: ADMIN

## Verificación

El script mostrará un mensaje de confirmación:
```
✅ Admin de pruebas creado/actualizado: admin@canalmedico.test / Admin123!
```

## Notas de Seguridad

⚠️ **IMPORTANTE:**
- Estas credenciales son SOLO para pruebas
- No documentar estas credenciales como definitivas
- Cambiar la contraseña después de las pruebas si es necesario
- El email `.test` indica que es para entorno de pruebas

