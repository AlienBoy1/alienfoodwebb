import { connectToDatabase } from "../../../util/mongodb";
import { getSession } from "next-auth/client";
import { ObjectId } from "bson";

// GET - Obtener notificaciones del usuario
// POST - Marcar notificación como leída
export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const { db } = await connectToDatabase();
    const userId = session.user.email;

    if (req.method === "GET") {
      // Obtener todas las notificaciones del usuario, ordenadas por fecha (más recientes primero)
      const notifications = await db
        .collection("notifications")
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(100) // Limitar a las últimas 100 notificaciones
        .toArray();

      return res.status(200).json(notifications);
    }

    if (req.method === "POST") {
      // Marcar notificación como leída
      const { notificationId, read } = req.body;

      if (!notificationId) {
        return res.status(400).json({ message: "ID de notificación requerido" });
      }

      const updateData = {
        read: read !== undefined ? read : true,
        readAt: read !== false ? new Date() : null,
      };

      const result = await db.collection("notifications").updateOne(
        { _id: ObjectId(notificationId), userId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Notificación no encontrada" });
      }

      return res.status(200).json({ message: "Notificación actualizada" });
    }

    if (req.method === "PUT") {
      // Marcar todas las notificaciones como leídas
      const result = await db.collection("notifications").updateMany(
        { userId, read: false },
        { $set: { read: true, readAt: new Date() } }
      );

      return res.status(200).json({ 
        message: "Todas las notificaciones marcadas como leídas",
        updated: result.modifiedCount 
      });
    }

    if (req.method === "DELETE") {
      // Eliminar notificación
      const { notificationId } = req.body;

      if (!notificationId) {
        return res.status(400).json({ message: "ID de notificación requerido" });
      }

      const result = await db.collection("notifications").deleteOne({
        _id: ObjectId(notificationId),
        userId,
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Notificación no encontrada" });
      }

      return res.status(200).json({ message: "Notificación eliminada" });
    }

    return res.status(405).json({ message: "Método no permitido" });
  } catch (error) {
    console.error("Error en API de notificaciones:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

