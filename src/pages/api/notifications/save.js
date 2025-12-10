import { connectToDatabase } from "../../../util/mongodb";
import { getSession } from "next-auth/client";

// Endpoint para guardar notificaciones cuando se reciben
// Este endpoint puede ser llamado desde el service worker o desde el cliente
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { userId, title, body, icon, data, tag } = req.body;

    // Intentar obtener userId de la sesión si no se proporciona
    let targetUserId = userId;
    if (!targetUserId) {
      try {
        const session = await getSession({ req });
        if (session && session.user) {
          targetUserId = session.user.email;
        }
      } catch (e) {
        // Si no hay sesión, continuar con userId del body
      }
    }

    if (!targetUserId || !title || !body) {
      return res.status(400).json({ message: "userId, title y body son requeridos" });
    }

    const { db } = await connectToDatabase();

    // Verificar si ya existe una notificación con el mismo tag para evitar duplicados
    if (tag) {
      const existing = await db.collection("notifications").findOne({
        userId: targetUserId,
        tag: tag,
      });

      if (existing) {
        // Si ya existe, no crear duplicado
        return res.status(200).json({
          message: "Notificación ya existe",
          notificationId: existing._id,
        });
      }
    }

    // Guardar la notificación en la base de datos
    const notification = {
      userId: targetUserId,
      title,
      body,
      icon: icon || "/img/favicons/android-chrome-192x192.png",
      data: data || { url: "/" },
      tag: tag || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date(),
    };

    const result = await db.collection("notifications").insertOne(notification);

    console.log(`Notificación guardada para ${targetUserId}:`, title);

    return res.status(201).json({
      message: "Notificación guardada",
      notificationId: result.insertedId,
    });
  } catch (error) {
    console.error("Error guardando notificación:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

