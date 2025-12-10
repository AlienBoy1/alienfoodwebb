# Solución: Quitar Autenticación de Vercel

## Problema
Al acceder a la aplicación desde celular, Vercel pide autenticación SSO antes de permitir el acceso.

## Solución

### Paso 1: Acceder a la Configuración del Proyecto
1. Ve a tu dashboard de Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto `aalienfoodwebb` (o el nombre que tenga)

### Paso 2: Desactivar Protección de Acceso
1. Ve a **Settings** (Configuración)
2. Busca la sección **"Deployment Protection"** o **"Access Control"**
3. Si está habilitada la protección:
   - Desactiva **"Password Protection"** o **"Vercel Authentication"**
   - O cambia la configuración a **"Public"** (Público)
4. Guarda los cambios

### Paso 3: Verificar Dominio
1. En **Settings** → **Domains**
2. Asegúrate de que tu dominio principal esté configurado como público
3. Si tienes un dominio personalizado, verifica que no tenga restricciones

### Paso 4: Verificar Configuración del Equipo
1. Si el proyecto está en un equipo de Vercel:
   - Ve a **Settings** → **General**
   - Verifica que no haya restricciones de acceso a nivel de equipo
   - Si es necesario, cambia la visibilidad del proyecto a **"Public"**

## Nota Importante
- Después de hacer estos cambios, puede tomar unos minutos para que se apliquen
- Si sigues viendo la pantalla de autenticación, limpia la caché del navegador y prueba en modo incógnito
- Asegúrate de que tu proyecto no esté en un plan que requiera autenticación por defecto

