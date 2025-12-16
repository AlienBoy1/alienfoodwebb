import { connectToDatabase } from "../../../util/mongodb";
import { withAdmin } from "../../../middleware/auth";
import { validateNotificationData } from "../../../util/security";
import { checkRateLimit } from "../../../util/rateLimiter";
import { setSecurityHeaders } from "../../../util/security";
import { configureWebPush } from "../../../util/vapid";
import webpush from "web-push";

// Configurar web-push al cargar el módulo
configureWebPush();

async function handler(req, res) {
    // Aplicar rate limiting
    const canContinue = await checkRateLimit(req, res);
    if (!canContinue) {
        return; // Ya se envió respuesta 429
    }

    // Agregar headers de seguridad
    setSecurityHeaders(res);

    if (req.method !== "POST") {
        return res.status(405).json({ message: "Método no permitido" });
    }

    try {
        // Validar y sanitizar datos
        const validation = validateNotificationData(req.body);
        
        if (!validation.isValid) {
            return res.status(400).json({
                message: validation.errors[0] || "Datos inválidos",
                errors: validation.errors,
            });
        }

        const { title, message, userId } = validation.data;

    const { db } = await connectToDatabase();

    let subscriptions;

    if (userId && userId !== "all") {
      // Enviar a un usuario específico
      subscriptions = await db
        .collection("pushSubscriptions")
        .find({ userId: userId })
        .toArray();
      console.log(`Encontradas ${subscriptions.length} suscripciones para usuario ${userId}`);
    } else {
      // Enviar a todos los usuarios
      subscriptions = await db
        .collection("pushSubscriptions")
        .find({})
        .toArray();
      console.log(`Encontradas ${subscriptions.length} suscripciones totales`);
    }

    // Validar que las suscripciones tengan la estructura correcta
    subscriptions = subscriptions.filter(sub => {
      if (!sub.subscription || !sub.subscription.endpoint) {
        console.warn(`Suscripción inválida encontrada para ${sub.userId}, eliminándola`);
        db.collection("pushSubscriptions").deleteOne({ _id: sub._id }).catch(console.error);
        return false;
      }
      return true;
    });

    console.log(`Suscripciones válidas después de filtrar: ${subscriptions.length}`);

    // Generar un tag único para cada notificación
    const uniqueTag = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Crear el payload de la notificación
    const notificationData = {
      title: title,
      body: message,
      message: message,
      icon: "/img/favicons/android-chrome-192x192.png",
      badge: "/img/favicons/android-chrome-192x192.png",
      data: {
        url: "/",
        tag: uniqueTag,
      },
      tag: uniqueTag,
      timestamp: Date.now(),
      requireInteraction: false,
      vibrate: [200, 100, 200],
    };

    console.log("📦 Payload de notificación creado:", JSON.stringify(notificationData));

    console.log(`📤 Enviando notificaciones push a ${subscriptions.length} suscripciones`);

    
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          console.log(`📤 Enviando notificación push a ${sub.userId}`);
          console.log(`Endpoint: ${sub.subscription.endpoint.substring(0, 50)}...`);
          console.log(`Payload: ${JSON.stringify(notificationData)}`);
          
          // Verificar que las claves de suscripción estén presentes
          if (!sub.subscription.keys || !sub.subscription.keys.p256dh || !sub.subscription.keys.auth) {
            console.warn(`Suscripción sin claves para ${sub.userId}, eliminándola`);
            await db.collection("pushSubscriptions").deleteOne({ _id: sub._id });
            return { success: false, userId: sub.userId, error: "Suscripción sin claves" };
          }

          console.log("✅ Web-push configurado con VAPID keys");
          console.log(`Claves de suscripción presentes: p256dh=${!!sub.subscription.keys.p256dh}, auth=${!!sub.subscription.keys.auth}`);

          // Intentar enviar la notificación
          await webpush.sendNotification(sub.subscription, JSON.stringify(notificationData));
          
          // Si se envió correctamente, también guardarla en la colección de notificaciones
          try {
            await db.collection("notifications").insertOne({
              userId: sub.userId,
              title: notificationData.title,
              body: notificationData.body,
              icon: notificationData.icon,
              data: notificationData.data,
              tag: notificationData.tag,
              read: false,
              createdAt: new Date(),
            });
          } catch (saveError) {
            console.error(`Error guardando notificación en BD para ${sub.userId}:`, saveError);
            // No fallar el envío si falla el guardado
          }
          
          return { success: true, userId: sub.userId };
        } catch (error) {
          console.error(`Error enviando notificación a ${sub.userId}:`, error);
          console.error(`Detalles del error:`, {
            statusCode: error.statusCode,
            message: error.message,
            body: error.body
          });
          
          // Si la suscripción es inválida (410 = Gone, 404 = Not Found), eliminarla
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Eliminando suscripción inválida para ${sub.userId}`);
            await db.collection("pushSubscriptions").deleteOne({ _id: sub._id });
            
            // Intentar renovar la suscripción automáticamente si es posible
            // Esto se hará cuando el usuario vuelva a la app y se suscriba de nuevo
            return { success: false, userId: sub.userId, error: "Suscripción inválida o expirada - será renovada automáticamente" };
          } else {
            // Si falla por estar offline u otro problema temporal, guardar la notificación pendiente
            console.log(`Guardando notificación pendiente para ${sub.userId}`);
            await db.collection("pendingNotifications").insertOne({
              userId: sub.userId,
              payload: notificationData,
              createdAt: new Date(),
            });
            
            // También guardar en la colección de notificaciones para que aparezca cuando vuelva online
            try {
              await db.collection("notifications").insertOne({
                userId: sub.userId,
                title: notificationData.title,
                body: notificationData.body,
                icon: notificationData.icon,
                data: notificationData.data,
                tag: notificationData.tag,
                read: false,
                createdAt: new Date(),
              });
            } catch (saveError) {
              console.error(`Error guardando notificación en BD para ${sub.userId}:`, saveError);
            }
          }
          return { success: false, userId: sub.userId, error: error.message };
        }
      })
    );

        const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
        const failed = results.length - successful;

        return res.status(200).json({
            message: `Notificaciones enviadas: ${successful} exitosas, ${failed} fallidas`,
            sent: successful,
            failed: failed,
            results: results.map((r) => r.status === "fulfilled" ? r.value : { success: false, error: r.reason }),
        });
    } catch (error) {
        console.error("Error en API de notificaciones:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
}

export default withAdmin(handler);
