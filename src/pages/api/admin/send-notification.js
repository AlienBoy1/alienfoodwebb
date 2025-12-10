import { connectToDatabase } from "../../../util/mongodb";
import { getSession } from "next-auth/client";
import webpush from "web-push";
import { getVapidKeys, configureWebPush } from "../../../util/vapid";

// Asegurarnos de que web-push está configurado con las VAPID keys (desde env o generadas en memoria)
// IMPORTANTE: configureWebPush debe llamarse antes de cada envío para asegurar que las keys estén configuradas
let vapidKeys = null;

function ensureWebPushConfigured() {
  configureWebPush();
  vapidKeys = getVapidKeys();
  
  if (!vapidKeys || !vapidKeys.publicKey || !vapidKeys.privateKey) {
    console.error("No VAPID keys disponibles. Por favor, configura VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en .env.local o deja que el servidor genere claves en memoria.");
    return false;
  }
  
  return true;
}

// Configurar al cargar el módulo
ensureWebPushConfigured();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const session = await getSession({ req });

    if (!session || !session.admin) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const { title, message, userId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Título y mensaje son requeridos" });
    }

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
    
    // Crear el payload de notificación
    // IMPORTANTE: web-push requiere que el payload sea un string JSON
    const notificationPayload = JSON.stringify({
      title: title,
      body: message,
      message: message, // Algunos navegadores usan 'message' en lugar de 'body'
      icon: "/img/favicons/android-chrome-192x192.png",
      badge: "/img/favicons/android-chrome-192x192.png",
      data: {
        url: "/",
        tag: uniqueTag,
      },
      tag: uniqueTag, // Tag único para cada notificación
      timestamp: Date.now(),
    });
    
    console.log("📦 Payload de notificación creado:", notificationPayload);

    // Si no hay suscripciones encontradas para el usuario objetivo,
    // guardamos la notificación en pendingNotifications para entregarla
    // cuando el usuario se vuelva a suscribir.
    if (subscriptions.length === 0) {
      // Si se especificó un userId, guardarla para ese usuario
      if (userId && userId !== "all") {
        await db.collection("pendingNotifications").insertOne({
          userId,
          payload: JSON.parse(notificationPayload),
          createdAt: new Date(),
        });

        return res.status(200).json({ message: "Usuario offline: notificación guardada para entrega posterior", sent: 0, failed: 1, total: 0 });
      }

      return res.status(404).json({ message: "No hay suscripciones encontradas" });
    }

    const notificationData = JSON.parse(notificationPayload);
    
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          // Verificar que la suscripción tenga la estructura correcta
          if (!sub.subscription || !sub.subscription.endpoint) {
            console.error(`Suscripción inválida para ${sub.userId}:`, sub);
            return { success: false, userId: sub.userId, error: "Suscripción inválida" };
          }

          console.log(`📤 Enviando notificación push a ${sub.userId}`);
          console.log(`Endpoint: ${sub.subscription.endpoint.substring(0, 80)}...`);
          console.log(`Payload:`, notificationPayload);
          
          // Asegurarse de que webpush esté configurado antes de enviar
          if (!ensureWebPushConfigured()) {
            throw new Error("VAPID keys no configuradas correctamente");
          }
          
          // Verificar que la suscripción tenga todas las claves necesarias
          if (!sub.subscription.keys || !sub.subscription.keys.p256dh || !sub.subscription.keys.auth) {
            console.error(`Suscripción sin claves para ${sub.userId}:`, sub.subscription);
            throw new Error("Suscripción incompleta: faltan claves de cifrado");
          }
          
          console.log(`Claves de suscripción presentes: p256dh=${!!sub.subscription.keys.p256dh}, auth=${!!sub.subscription.keys.auth}`);
          
          try {
            const result = await webpush.sendNotification(
              sub.subscription,
              notificationPayload,
              {
                // Opciones adicionales para webpush
                TTL: 86400, // 24 horas
                urgency: 'normal',
              }
            );
            
            console.log(`✅ Notificación push enviada exitosamente a ${sub.userId}`);
            console.log(`Status code: ${result.statusCode || 'N/A'}`);
            console.log(`Headers:`, result.headers || {});
            
            // Verificar que la respuesta sea exitosa
            if (result.statusCode && result.statusCode >= 200 && result.statusCode < 300) {
              console.log(`✅ Notificación push aceptada por el servicio push (${result.statusCode})`);
            } else {
              console.warn(`⚠️ Respuesta inesperada del servicio push: ${result.statusCode}`);
            }
          } catch (pushError) {
            console.error(`❌ Error en webpush.sendNotification:`, pushError);
            throw pushError;
          }
          
          // Guardar la notificación en la base de datos para el usuario
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
            console.log(`Notificación guardada en BD para ${sub.userId}`);
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
            return { success: false, userId: sub.userId, error: "Suscripción inválida o expirada" };
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
      message: "Notificaciones enviadas",
      sent: successful,
      failed: failed,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error("Error enviando notificaciones:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

