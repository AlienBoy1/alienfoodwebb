# 🚀 Guía de Despliegue en Vercel

## ✅ Ventajas de Vercel

- ✅ **HTTPS automático** - Las notificaciones push funcionarán en móviles
- ✅ **Despliegue rápido** - Conecta tu repositorio y despliega en minutos
- ✅ **Dominio gratuito** - Obtienes un dominio `.vercel.app`
- ✅ **Variables de entorno** - Fácil configuración de VAPID keys
- ✅ **Actualizaciones automáticas** - Cada push a tu repositorio despliega automáticamente

## 📋 Requisitos Previos

1. **Cuenta en Vercel** (gratis): https://vercel.com/signup
2. **Repositorio en GitHub/GitLab/Bitbucket** (o sube el código manualmente)
3. **VAPID Keys generadas** (ver paso 1)

## 🔑 Paso 1: Generar VAPID Keys

Las VAPID keys son necesarias para las notificaciones push. **IMPORTANTE:** Genera estas keys UNA VEZ y guárdalas, porque las necesitarás en Vercel.

```bash
npx web-push generate-vapid-keys
```

Esto generará algo como:

```
Public Key:
BGx...tu-clave-publica...xyz

Private Key:
abc...tu-clave-privada...123
```

**⚠️ IMPORTANTE:** Guarda estas keys en un lugar seguro. Las necesitarás para configurar Vercel.

## 📤 Paso 2: Preparar el Proyecto

### 2.1 Verificar que no haya archivos sensibles

Asegúrate de que `.env.local` esté en `.gitignore`:

```bash
# .gitignore
.env.local
.env*.local
```

### 2.2 Verificar dependencias

Asegúrate de que todas las dependencias estén en `package.json`:

```bash
npm install
```

## 🌐 Paso 3: Desplegar en Vercel

### Opción A: Desde la Web (Recomendado)

1. **Ve a Vercel:** https://vercel.com/new
2. **Conecta tu repositorio:**
   - Si tu código está en GitHub/GitLab/Bitbucket, conéctalo
   - O haz clic en "Upload" para subir el código manualmente
3. **Configura el proyecto:**
   - Framework Preset: **Next.js** (debería detectarse automáticamente)
   - Root Directory: `.` (dejar por defecto)
   - Build Command: `npm run build` (debería estar por defecto)
   - Output Directory: `.next` (debería estar por defecto)
4. **Configura Variables de Entorno:**
   - Haz clic en "Environment Variables"
   - Agrega las siguientes variables:

   ```
   VAPID_PUBLIC_KEY = tu-clave-publica-generada
   VAPID_PRIVATE_KEY = tu-clave-privada-generada
   ```

   También necesitarás agregar otras variables si las usas:
   ```
   MONGODB_URI = tu-uri-de-mongodb
   NEXTAUTH_URL = https://tu-dominio.vercel.app
   NEXTAUTH_SECRET = tu-secret-de-nextauth
   STRIPE_PUBLIC_KEY = tu-stripe-public-key
   ```

5. **Despliega:**
   - Haz clic en "Deploy"
   - Espera a que termine el despliegue (2-5 minutos)

### Opción B: Desde la Terminal (CLI)

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Iniciar sesión:**
   ```bash
   vercel login
   ```

3. **Desplegar:**
   ```bash
   vercel
   ```
   
   Sigue las instrucciones en pantalla. Cuando te pregunte por variables de entorno, agrégalas.

4. **Agregar variables de entorno después del despliegue:**
   ```bash
   vercel env add VAPID_PUBLIC_KEY
   vercel env add VAPID_PRIVATE_KEY
   vercel env add MONGODB_URI
   # ... etc
   ```

5. **Redesplegar para aplicar las variables:**
   ```bash
   vercel --prod
   ```

## ⚙️ Paso 4: Configurar Variables de Entorno en Vercel

### Desde el Dashboard de Vercel:

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

| Variable | Valor | Entornos |
|----------|-------|----------|
| `VAPID_PUBLIC_KEY` | Tu clave pública VAPID | Production, Preview, Development |
| `VAPID_PRIVATE_KEY` | Tu clave privada VAPID | Production, Preview, Development |
| `MONGODB_URI` | Tu URI de MongoDB | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://tu-proyecto.vercel.app` | Production |
| `NEXTAUTH_SECRET` | Un string aleatorio seguro | Production, Preview, Development |
| `STRIPE_PUBLIC_KEY` | Tu clave pública de Stripe | Production, Preview, Development |

### Generar NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

O usa un generador online: https://generate-secret.vercel.app/32

## 🔄 Paso 5: Redesplegar

Después de agregar las variables de entorno:

1. Ve a tu proyecto en Vercel
2. Haz clic en **Deployments**
3. Haz clic en los tres puntos (⋯) del último despliegue
4. Selecciona **Redeploy**

O desde la terminal:

```bash
vercel --prod
```

## ✅ Paso 6: Verificar que Funciona

1. **Accede a tu aplicación:**
   - URL: `https://tu-proyecto.vercel.app`
   - Debería cargar normalmente

2. **Probar notificaciones push:**
   - Inicia sesión en la aplicación
   - Haz clic en el icono de campana (notificaciones)
   - Haz clic en "Activar Notificaciones"
   - Debería funcionar porque ahora estás en HTTPS ✅

## 🐛 Solución de Problemas

### Error: "VAPID keys inválidas"

**Solución:**
1. Verifica que las VAPID keys estén correctamente copiadas en Vercel
2. Asegúrate de que no tengan espacios extra al inicio o final
3. Redespliega después de corregir las variables

### Error: "MongoDB connection failed"

**Solución:**
1. Verifica que `MONGODB_URI` esté configurada en Vercel
2. Asegúrate de que tu MongoDB permita conexiones desde cualquier IP (o agrega la IP de Vercel)
3. Si usas MongoDB Atlas, verifica que la IP `0.0.0.0/0` esté permitida

### Error: "NextAuth configuration error"

**Solución:**
1. Verifica que `NEXTAUTH_URL` esté configurada con tu URL de Vercel
2. Verifica que `NEXTAUTH_SECRET` esté configurada
3. Redespliega después de corregir

### Las notificaciones push no funcionan

**Solución:**
1. Verifica que estés accediendo por HTTPS (Vercel lo proporciona automáticamente)
2. Verifica que las VAPID keys estén configuradas correctamente
3. Abre la consola del navegador (F12) y busca errores
4. Verifica que el service worker esté registrado correctamente

## 📝 Notas Importantes

- ✅ **HTTPS automático:** Vercel proporciona HTTPS automáticamente, así que las notificaciones push funcionarán
- ✅ **Variables de entorno:** Todas las variables sensibles deben estar en Vercel, NO en el código
- ✅ **Redesplegar:** Después de cambiar variables de entorno, necesitas redesplegar
- ✅ **Dominio personalizado:** Puedes agregar tu propio dominio en Settings → Domains
- ✅ **Actualizaciones automáticas:** Cada push a tu rama principal despliega automáticamente

## 🎉 ¡Listo!

Una vez desplegado en Vercel, las notificaciones push funcionarán perfectamente en dispositivos móviles porque Vercel proporciona HTTPS automáticamente.

## 📚 Recursos Adicionales

- Documentación de Vercel: https://vercel.com/docs
- Documentación de Next.js en Vercel: https://vercel.com/docs/frameworks/nextjs
- Soporte de Vercel: https://vercel.com/support

