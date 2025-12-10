import { getVapidKeys, configureWebPush } from "../../../util/vapid";

export default function handler(req, res) {
  try {
    const keys = getVapidKeys();
    // Asegurar que web-push está configurado en el servidor
    configureWebPush();
    
    // Validar que la clave pública tenga un formato razonable
    if (!keys.publicKey || keys.publicKey.length < 20) {
      console.error("❌ VAPID public key inválida:", keys.publicKey?.length || 0);
      return res.status(500).json({ 
        message: "VAPID public key inválida. Genera nuevas keys con: npx web-push generate-vapid-keys" 
      });
    }
    
    return res.status(200).json({ publicKey: keys.publicKey });
  } catch (error) {
    console.error("❌ Error obteniendo VAPID public key:", error);
    return res.status(500).json({ 
      message: error.message || "Error obteniendo VAPID key. Verifica que las VAPID keys estén correctamente configuradas en .env.local" 
    });
  }
}
