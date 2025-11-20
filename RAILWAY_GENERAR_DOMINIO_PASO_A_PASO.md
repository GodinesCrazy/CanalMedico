# 🌐 Cómo Generar el Dominio en Railway - Paso a Paso

## ❌ Problema

Estás en la página de Networking pero no aparece una URL después de hacer clic en "Generate Domain".

## ✅ Solución: Configurar el Puerto Correctamente

En Railway, el puerto que debes usar depende de cómo esté configurado tu backend. Sigue estos pasos:

### Paso 1: Verificar el Puerto Correcto

El backend usa `env.PORT` que Railway asigna automáticamente. Sin embargo, para generar el dominio, necesitas especificar un puerto.

**Opciones:**

#### Opción A: Usar el Puerto que Railway Asigna (Recomendado)

1. **Deja el campo de puerto vacío** o cámbialo a `3000` (puerto común para Node.js)
2. O si Railway te permite, **déjalo vacío** para que use automáticamente la variable `PORT`

#### Opción B: Usar Puerto Específico

1. **Cambia el puerto de `8080` a `3000`** (puerto estándar para Node.js/Express)
2. O usa `5000` si ese es tu puerto preferido

### Paso 2: Configurar el Campo de Puerto

En la sección "Generate Service Domain":

1. **Campo: "Enter the port your app is listening on"**
   - **Opción 1**: Cambia de `8080` a `3000` 
   - **Opción 2**: Déjalo en `8080` si tu app escucha ahí (pero verifica tu código)

2. **Checkbox "Choose your target port"**: 
   - Si está disponible, márcalo para que Railway escoja automáticamente

### Paso 3: Hacer Clic en "Generate Domain"

1. **Haz clic en el botón morado "Generate Domain"**
2. **Espera unos segundos** - Railway generará la URL
3. Deberías ver una URL como: `https://canalmedico-production-xxxx.up.railway.app`

### Paso 4: Si Aún No Aparece la URL

#### Verifica que el Servicio Esté Desplegado

1. Ve a la pestaña **"Deployments"** (arriba, junto a Settings)
2. Verifica que haya un deployment exitoso
3. Si no hay deployments, Railway no puede generar el dominio

#### Verifica las Variables de Entorno

1. Ve a la pestaña **"Variables"** (arriba)
2. Verifica que `PORT` esté configurada (Railway la asigna automáticamente)
3. Si no está, agrega: `PORT` = `3000` (o `${{PORT}}` si Railway lo soporta)

#### Alternativa: Obtener la URL del Deployment

1. Ve a **"Deployments"**
2. Haz clic en el deployment más reciente
3. Busca **"Public URL"** o **"Domain"** en los detalles del deployment
4. Copia esa URL para usar como `API_URL`

## 🔧 Configuración Recomendada del Puerto

Para evitar problemas, configura:

1. **En Variables del servicio:**
   - Variable: `PORT`
   - Valor: `3000` (o déjalo vacío para que Railway asigne uno)

2. **En el campo de Networking:**
   - Puerto: `3000` (mismo que configuraste en Variables)

3. **Luego haz clic en "Generate Domain"**

## 📝 Nota Importante

**El puerto que uses aquí debe coincidir con el puerto que tu aplicación escucha**. 

Como tu backend usa `env.PORT`, Railway asigna automáticamente el puerto en la variable `PORT`. El campo en Networking es para decirle a Railway en qué puerto debe exponer el servicio.

## ✅ Checklist

- [ ] Campo de puerto configurado (3000 recomendado)
- [ ] Variable `PORT` configurada en Variables (3000 o automático)
- [ ] Deployment exitoso existe
- [ ] Clic en "Generate Domain"
- [ ] URL generada visible
- [ ] URL copiada para usar en `API_URL`

## 🆘 Si Aún No Funciona

1. **Intenta cambiar el puerto a `3000`** en el campo de Networking
2. **Haz clic en "Generate Domain"** nuevamente
3. **Espera 10-15 segundos** - a veces Railway tarda
4. **Refresca la página** (F5) para ver si aparece
5. **Verifica que haya un deployment activo** en la pestaña Deployments

---

**Recuerda**: La URL aparecerá solo después de que Railway procese la solicitud. Si el botón está en gris o deshabilitado, puede que necesites esperar a que haya un deployment activo primero.

