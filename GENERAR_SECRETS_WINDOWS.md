# 🔐 Generar JWT Secrets en Windows

## ❌ Problema

`openssl` no está instalado en Windows PowerShell.

## ✅ Solución: Usar PowerShell Nativo

### Método 1: PowerShell (Recomendado)

Ejecuta este comando en PowerShell para generar un JWT_SECRET:

```powershell
$bytes = New-Object byte[] 32; [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

**Ejecuta el comando DOS VECES** para generar:
1. `JWT_SECRET` - Primera ejecución
2. `JWT_REFRESH_SECRET` - Segunda ejecución

### Método 2: PowerShell Simplificado

```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 43 | ForEach-Object {[char]$_})
```

Este genera un string alfanumérico de 43 caracteres.

### Método 3: Node.js (Si está instalado)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Método 4: Generador Online

Si prefieres usar un generador online:
1. Ve a: https://generate-secret.vercel.app/32
2. Copia el valor generado
3. Úsalo como `JWT_SECRET` y genera otro para `JWT_REFRESH_SECRET`

## 📋 Pasos para Configurar en Railway

1. **Genera dos valores** (uno para `JWT_SECRET`, otro para `JWT_REFRESH_SECRET`)
2. **En Railway → Variables**:
   - Edita `JWT_SECRET` → Pega el primer valor generado
   - Agrega `JWT_REFRESH_SECRET` → Pega el segundo valor generado
3. **Guarda los cambios**

## ⚠️ Importante

- **NO compartas estos valores** - Son secrets críticos
- **Guárdalos de forma segura** - Los necesitarás si cambias de plataforma
- **NO los cambies en producción** una vez configurados

---

**Recomendación**: Usa el Método 1 (PowerShell) que es el más seguro y aleatorio.

