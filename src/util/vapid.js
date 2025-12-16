import webpush from "web-push";

// Módulo para centralizar la gestión de VAPID keys.
// IMPORTANTE: Para producción, SIEMPRE usa VAPID keys desde variables de entorno.
// Las keys generadas en memoria cambian en cada reinicio y causan errores.

let generatedKeys = null;

export function getVapidKeys() {
  // Prioridad 1: Variables de entorno (producción)
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    const publicKey = process.env.VAPID_PUBLIC_KEY.trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY.trim();
    
    // Validar formato básico (las VAPID keys públicas tienen ~87 caracteres, privadas ~43)
    // Pero pueden variar, así que solo validamos que no estén vacías
    if (!publicKey || publicKey.length < 20 || !privateKey || privateKey.length < 20) {
      console.error("❌ VAPID keys de entorno tienen formato inválido");
      console.error("Public key length:", publicKey?.length || 0);
      console.error("Private key length:", privateKey?.length || 0);
      console.error("⚠️ Las VAPID keys deben tener al menos 20 caracteres cada una");
      console.error("⚠️ Genera nuevas keys con: npx web-push generate-vapid-keys");
      throw new Error("Las VAPID keys de entorno no tienen un formato válido. Genera nuevas keys con: npx web-push generate-vapid-keys");
    }
    
    return {
      publicKey,
      privateKey,
    };
  }

  // Prioridad 2: Keys generadas en memoria (solo para desarrollo local)
  // ADVERTENCIA: Estas keys cambian en cada reinicio, causando errores de suscripción
  if (!generatedKeys) {
    console.warn("⚠️ No VAPID env vars found — generando VAPID keys en memoria para pruebas locales");
    console.warn("⚠️ ADVERTENCIA: Estas keys cambiarán en cada reinicio del servidor");
    console.warn("⚠️ Para producción, configura VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en .env.local");
    generatedKeys = webpush.generateVAPIDKeys();
    console.log("✅ VAPID keys generadas. Public key:", generatedKeys.publicKey.substring(0, 50) + "...");
  }

  return generatedKeys;
}

export function configureWebPush() {
  const keys = getVapidKeys();
  try {
    // Usar un email de contacto válido
    webpush.setVapidDetails("mailto:admin@tuneldeltiempo.com", keys.publicKey, keys.privateKey);
    console.debug("✅ Web-push configurado con VAPID keys");
  } catch (e) {
    console.error("❌ Error configurando web-push VAPID details:", e);
    throw e;
  }
}

export default { getVapidKeys, configureWebPush };
