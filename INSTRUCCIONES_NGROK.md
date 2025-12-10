# 🚀 Instrucciones para Usar ngrok con Notificaciones Push

## ¿Por qué ngrok?

Las notificaciones push **requieren HTTPS** en dispositivos móviles. ngrok crea un túnel HTTPS seguro hacia tu servidor local de desarrollo.

## Pasos para Configurar

### 1. Instalar ngrok

**Opción A: Con npm (recomendado)**
```bash
npm install -g ngrok
```

**Opción B: Descargar manualmente**
- Ve a: https://ngrok.com/download
- Descarga el archivo ZIP para Windows
- Extrae el archivo `ngrok.exe` en una carpeta (ejemplo: `C:\ngrok\`)
- Agrega esa carpeta a tu PATH de Windows, O usa la ruta completa cuando ejecutes ngrok

**⚠️ IMPORTANTE EN WINDOWS:**
Si descargaste ngrok manualmente, necesitas ejecutarlo desde una terminal (PowerShell o CMD), NO haciendo doble clic en el archivo .exe

### 2. Iniciar el Servidor de Next.js

En tu **primera terminal**, ejecuta:

```bash
npm run dev
```

Espera a que aparezca el mensaje:
```
✓ Ready on http://localhost:3000
```

**⚠️ IMPORTANTE: No cierres esta terminal. Déjala corriendo.**

### 3. Iniciar ngrok

**⚠️ IMPORTANTE EN WINDOWS:**

NO ejecutes ngrok haciendo doble clic en el archivo. Debes ejecutarlo desde una terminal.

**Método 1: Desde PowerShell o CMD (Recomendado)**

1. Abre **PowerShell** o **CMD** (no desde el explorador de archivos)
   - Presiona `Win + R`
   - Escribe `powershell` o `cmd`
   - Presiona Enter

2. Navega a la carpeta donde está ngrok (si lo descargaste manualmente):
   ```bash
   cd C:\ruta\a\ngrok
   ```

3. Ejecuta ngrok:
   ```bash
   ngrok http 3000
   ```

**Método 2: Si ngrok está en tu PATH**

Simplemente abre PowerShell o CMD y ejecuta:
```bash
ngrok http 3000
```

**Método 3: Desde la terminal de VS Code o tu editor**

Si estás usando VS Code o Cursor, puedes abrir una nueva terminal integrada:
- Presiona `` Ctrl + ` `` (backtick) para abrir la terminal
- O ve a: Terminal → New Terminal
- Ejecuta: `ngrok http 3000`

Verás algo como esto:

```
ngrok by @inconshreveable

Session Status                online
Account                       Tu Cuenta (Plan: Free)
Version                       2.3.40
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://abc123.ngrok.io -> http://localhost:3000
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**⚠️ IMPORTANTE: No cierres esta terminal tampoco. Déjala corriendo.**

### 4. Copiar la URL HTTPS

De la salida de ngrok, copia la URL que dice `Forwarding` con `https://`:

```
https://abc123.ngrok.io
```

**Nota:** Tu URL será diferente. Cada vez que reinicies ngrok, la URL cambiará (en el plan gratuito).

### 5. Acceder desde tu Móvil

1. Asegúrate de que tu móvil esté conectado a internet (puede ser WiFi o datos móviles)
2. Abre el navegador en tu móvil (Chrome, Safari, etc.)
3. Ingresa la URL HTTPS de ngrok:
   ```
   https://abc123.ngrok.io
   ```
   (Reemplaza con tu URL real)

4. La aplicación debería cargar normalmente
5. **Ahora las notificaciones push funcionarán** porque estás usando HTTPS

## Resumen Visual

```
┌─────────────────┐
│  Terminal 1     │
│  npm run dev    │  ← Servidor Next.js (puerto 3000)
│  (corriendo)    │
└─────────────────┘

┌─────────────────┐
│  Terminal 2     │
│  ngrok http 3000│  ← Túnel HTTPS
│  (corriendo)    │
└─────────────────┘
         │
         │ https://abc123.ngrok.io
         ▼
┌─────────────────┐
│  Tu Móvil       │
│  Navegador      │  ← Accede aquí con HTTPS
└─────────────────┘
```

## Solución de Problemas

### La ventana de CMD se cierra inmediatamente
**Problema:** Si haces doble clic en `ngrok.exe`, la ventana se abre y se cierra.

**Solución:** 
1. Abre PowerShell o CMD manualmente (Win + R → escribe `powershell` → Enter)
2. Navega a la carpeta de ngrok: `cd C:\ruta\a\ngrok`
3. Ejecuta: `ngrok http 3000`
4. La terminal permanecerá abierta mientras ngrok esté corriendo

### Error: "ngrok: command not found"
- Asegúrate de haber instalado ngrok correctamente
- En Windows, puede que necesites reiniciar la terminal después de instalar
- Verifica que ngrok esté en tu PATH
- Si lo descargaste manualmente, usa la ruta completa: `C:\ruta\a\ngrok\ngrok.exe http 3000`

### Error: "port 3000 is already in use"
- Verifica que el servidor de Next.js esté corriendo en el puerto 3000
- Si usas otro puerto, cambia el comando: `ngrok http PUERTO`

### La URL de ngrok cambia cada vez
- Esto es normal en el plan gratuito de ngrok
- Para una URL fija, necesitas el plan de pago de ngrok
- O puedes usar `ngrok http 3000 --domain=tu-dominio.ngrok.io` (requiere plan de pago)

### No puedo acceder desde el móvil
- Verifica que ngrok esté corriendo
- Verifica que el servidor de Next.js esté corriendo
- Asegúrate de usar la URL **HTTPS** (no HTTP)
- Verifica que tu móvil tenga conexión a internet

## Comandos Útiles

### Ver estadísticas de ngrok
Abre en tu navegador: `http://127.0.0.1:4040`

### Detener ngrok
Presiona `Ctrl+C` en la terminal donde está corriendo ngrok

### Detener el servidor de Next.js
Presiona `Ctrl+C` en la terminal donde está corriendo `npm run dev`

## Notas Importantes

- ✅ **Ambas terminales deben estar corriendo** al mismo tiempo
- ✅ **Usa la URL HTTPS** de ngrok, no la HTTP
- ✅ **La URL cambia** cada vez que reinicias ngrok (plan gratuito)
- ✅ **No necesitas estar en la misma red WiFi** - ngrok funciona desde cualquier lugar
- ✅ **Para producción**, usa un servicio de hosting con HTTPS real (Vercel, Netlify, etc.)

