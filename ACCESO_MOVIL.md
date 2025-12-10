# 📱 Acceso a la Aplicación desde Móvil

## URL para Acceder desde tu Celular

Para acceder a la aplicación desde tu dispositivo móvil, necesitas usar la **IP local de tu computadora** en la misma red WiFi.

### Paso 1: Obtener tu IP Local

Tu IP local actual es: **`192.168.0.21`**

### Paso 2: Iniciar el Servidor de Desarrollo

Asegúrate de que el servidor de Next.js esté corriendo:

```bash
npm run dev
```

O si usas yarn:

```bash
yarn dev
```

El servidor normalmente corre en el puerto **3000**.

### Paso 3: Acceder desde tu Móvil

1. **Asegúrate de que tu celular esté conectado a la misma red WiFi que tu computadora**

2. **Abre el navegador en tu celular** (Chrome, Safari, Firefox, etc.)

3. **Ingresa la siguiente URL:**

```
http://192.168.0.21:3000
```

### Paso 4: Si no Funciona

Si la IP no funciona, puedes encontrar tu IP actual ejecutando:

**Windows:**
```bash
ipconfig
```
Busca "Dirección IPv4" en la sección de tu adaptador WiFi/Ethernet.

**Mac/Linux:**
```bash
ifconfig
```
O:
```bash
ip addr show
```

### ⚠️ IMPORTANTE: Notificaciones Push Requieren HTTPS

**Las notificaciones push NO funcionan en HTTP en dispositivos móviles.** Solo funcionan con HTTPS.

Si necesitas probar las notificaciones push desde un móvil, tienes dos opciones:

#### Opción 1: Usar ngrok (Recomendado para desarrollo)

ngrok crea un túnel HTTPS seguro hacia tu servidor local.

1. **Instalar ngrok:**
   - Descarga desde: https://ngrok.com/download
   - O instala con npm: `npm install -g ngrok`

2. **Iniciar ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Obtener la URL HTTPS:**
   - ngrok mostrará una URL como: `https://abc123.ngrok.io`
   - Esta URL es HTTPS y funcionará con notificaciones push

4. **Acceder desde tu móvil:**
   - Abre el navegador en tu móvil
   - Ve a la URL HTTPS de ngrok (ejemplo: `https://abc123.ngrok.io`)

**Nota:** La URL de ngrok cambia cada vez que lo reinicias (en el plan gratuito). Para una URL fija, necesitas el plan de pago.

#### Opción 2: Configurar HTTPS Local (Más complejo)

Puedes configurar HTTPS localmente usando herramientas como `mkcert`:

1. **Instalar mkcert:**
   ```bash
   # Windows (con Chocolatey)
   choco install mkcert
   
   # Mac (con Homebrew)
   brew install mkcert
   ```

2. **Crear certificado local:**
   ```bash
   mkcert -install
   mkcert localhost 192.168.0.21
   ```

3. **Configurar Next.js para usar HTTPS:**
   - Esto requiere configuración adicional en `next.config.js` y un servidor proxy

**Recomendación:** Para desarrollo, usa ngrok. Es más simple y rápido.

### Notas Importantes:

- ✅ **Misma Red WiFi**: Tu celular y computadora deben estar en la misma red WiFi
- ✅ **Firewall**: Asegúrate de que el firewall de Windows no esté bloqueando el puerto 3000
- ✅ **HTTPS para Push**: Las notificaciones push requieren HTTPS en móviles (usa ngrok para desarrollo)
- ✅ **PWA**: La aplicación funciona como PWA, así que puedes instalarla en tu celular desde el navegador

### Instalar como PWA en Móvil:

1. Abre la aplicación en el navegador móvil
2. Busca la opción "Agregar a pantalla de inicio" o "Instalar app"
3. La aplicación se instalará como una app nativa en tu dispositivo

### Solución de Problemas:

**Si no puedes acceder:**
1. Verifica que ambos dispositivos estén en la misma red WiFi
2. Verifica que el servidor esté corriendo (`npm run dev`)
3. Verifica que el firewall permita conexiones en el puerto 3000
4. Intenta usar `0.0.0.0` en lugar de `localhost` al iniciar el servidor (modifica el script en `package.json`)

**Para usar en producción:**
- Despliega la aplicación en un servicio como Vercel, Netlify, o tu propio servidor
- Usa HTTPS (requerido para PWA y notificaciones push)
- La URL será la de tu dominio de producción

