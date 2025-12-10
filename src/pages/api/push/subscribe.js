import { connectToDatabase } from "../../../util/mongodb";
import { getSession } from "next-auth/client";
import { configureWebPush } from "../../../util/vapid";
import webpush from "web-push";

// Añadimos logs y validaciones adicionales para asegurar que la suscripción
// tiene endpoint y claves (p256dh, auth) antes de guardarla en la DB.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ message: "No autorizado" });
    }

    let { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({ message: "Suscripción requerida" });
    }

    // Normalizar la suscripción: puede venir en diferentes formatos
    // Si viene con keys como strings base64, convertirlas a objetos PushSubscriptionKeys
    if (subscription.keys && typeof subscription.keys.p256dh === 'string') {
      // Ya está en el formato correcto (base64 strings)
      // El formato está bien para guardar en MongoDB
    } else if (subscription.getKey) {
      // Si es un objeto PushSubscription real (no debería pasar desde el cliente, pero por si acaso)
      subscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
        },
      };
    }

    // Validación básica de la suscripción
    const hasEndpoint = !!subscription.endpoint;
    const hasKeys = !!subscription.keys && !!subscription.keys.p256dh && !!subscription.keys.auth;

    if (!hasEndpoint || !hasKeys) {
      console.error("Suscripción inválida recibida:", {
        hasEndpoint,
        hasKeys,
        hasP256dh: !!subscription.keys?.p256dh,
        hasAuth: !!subscription.keys?.auth,
        subscription: subscription ? "presente" : "ausente",
      });
      return res.status(400).json({ message: "Suscripción inválida: falta endpoint o keys" });
    }

    console.debug("✅ Suscripción válida recibida para user:", session.user.email);
    console.debug("Subscription endpoint:", subscription.endpoint.substring(0, 50) + "...");

    const { db } = await connectToDatabase();

    // Guardar o actualizar la suscripción del usuario
    await db.collection("pushSubscriptions").updateOne(
      { userId: session.user.email },
      {
        $set: {
          subscription: subscription,
          userId: session.user.email,
          username: session.user.username,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Después de guardar la suscripción, intentar enviar notificaciones pendientes
    try {
      configureWebPush();
      const pending = await db
        .collection("pendingNotifications")
        .find({ userId: session.user.email })
        .toArray();

      if (pending.length > 0) {
        console.debug(`Enviando ${pending.length} notificaciones pendientes a ${session.user.email}`);
        for (const p of pending) {
          try {
            await webpush.sendNotification(subscription, JSON.stringify(p.payload));
            // si se envió correctamente, borrarla
            await db.collection("pendingNotifications").deleteOne({ _id: p._id });
          } catch (e) {
            console.error("Error enviando notificación pendiente:", e);
            // Si la suscripción está inválida eliminarla
            if (e.statusCode === 410 || e.statusCode === 404) {
              await db.collection("pushSubscriptions").deleteOne({ userId: session.user.email });
            }
            // Si falla por otra razón, dejamos la notificación pendiente para reintentar luego
          }
        }
      }
    } catch (e) {
      console.error("Error procesando notificaciones pendientes:", e);
    }

    return res.status(200).json({ message: "Suscripción guardada exitosamente", subscription });
  } catch (error) {
    console.error("Error guardando suscripción:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}


