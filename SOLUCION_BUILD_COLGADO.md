# 🔧 Solución: Build se Cuelga en Vercel

## ❌ Problema Encontrado

El build en Vercel se cierra sin completarse, mostrando solo los warnings de deprecación pero sin mostrar el error completo.

## 🔍 Causa Identificada

El problema era que varias páginas con `getStaticProps` intentaban conectarse a MongoDB **sin manejo de errores adecuado**. Si las variables de entorno (`MONGODB_URI` y `MONGODB_DB`) no están configuradas en Vercel, o si hay un problema de conexión, el build se cuelga o falla silenciosamente.

### Páginas Afectadas:
1. `src/pages/admin/add-dish.js` - `getStaticProps` sin try/catch
2. `src/pages/admin/dishes.js` - `getStaticProps` sin try/catch  
3. `src/pages/admin/update-dish/[id].js` - `getStaticPaths` sin try/catch

## ✅ Solución Aplicada

He agregado manejo de errores (`try/catch`) a todas las funciones `getStaticProps` y `getStaticPaths` que se conectan a MongoDB. Ahora:

- Si hay un error de conexión durante el build, retornan valores por defecto (arrays vacíos)
- El build puede completarse incluso si las variables de entorno no están configuradas
- Los errores se registran en la consola pero no detienen el build

## 📝 Cambios Realizados

### 1. `src/pages/admin/add-dish.js`
```javascript
export const getStaticProps = async () => {
  try {
    const { db } = await connectToDatabase();
    // ... código existente ...
  } catch (error) {
    console.error("Error connecting to database:", error.message);
    return {
      props: {
        categories: [],
      },
      revalidate: 1,
    };
  }
};
```

### 2. `src/pages/admin/dishes.js`
```javascript
export const getStaticProps = async () => {
  try {
    const { db } = await connectToDatabase();
    // ... código existente ...
  } catch (error) {
    console.error("Error connecting to database:", error.message);
    return {
      props: {
        dishes: [],
      },
      revalidate: 1,
    };
  }
};
```

### 3. `src/pages/admin/update-dish/[id].js`
```javascript
export const getStaticPaths = async () => {
  try {
    const { db } = await connectToDatabase();
    // ... código existente ...
  } catch (error) {
    console.error("Error connecting to database:", error.message);
    return {
      paths: [],
      fallback: true,
    };
  }
};
```

## 📝 Pasos Siguientes

1. **Haz commit y push de los cambios:**
   ```bash
   git add .
   git commit -m "Fix: Add error handling to getStaticProps and getStaticPaths"
   git push
   ```

2. **Vercel se redesplegará automáticamente** cuando hagas push

3. **El build debería completarse exitosamente** incluso si las variables de entorno no están configuradas

## ⚠️ Importante: Configurar Variables de Entorno

Aunque el build ahora puede completarse sin las variables de entorno, **debes configurarlas en Vercel** para que la aplicación funcione correctamente en producción:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega estas variables (ver `VARIABLES_VERCEL.md` para más detalles):
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`

## 🔍 Verificación

Después del redespliegue, deberías ver:
```
Installing dependencies...
npm install --legacy-peer-deps
✓ Dependencies installed
Running "npm run build"
✓ Compiled successfully
✓ Collecting page data...
✓ Generating static pages...
✓ Build completed
```

## 📚 Nota

El manejo de errores permite que el build se complete, pero las páginas mostrarán datos vacíos si no hay conexión a MongoDB. Una vez que configures las variables de entorno en Vercel, las páginas funcionarán correctamente con datos reales.

