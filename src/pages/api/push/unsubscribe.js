import { connectToDatabase } from "../../../util/mongodb";
import { getSession } from "next-auth/client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const { endpoint, userId } = req.body;
    
    // Usar userId del body si está disponible, sino usar el de la sesión
    const targetUserId = userId || session.user.email;
    
    if (!endpoint) {
      return res.status(400).json({ message: "Endpoint requerido" });
    }

    const { db } = await connectToDatabase();

    // Eliminar la suscripción asociada al usuario y al endpoint
    const result = await db.collection("pushSubscriptions").deleteOne({ 
      userId: targetUserId, 
      "subscription.endpoint": endpoint 
    });

    if (result.deletedCount === 0) {
      // Intentar eliminar solo por userId si no se encontró con endpoint
      await db.collection("pushSubscriptions").deleteMany({ userId: targetUserId });
    }

    return res.status(200).json({ message: "Suscripción eliminada" });
  } catch (error) {
    console.error("Error eliminando suscripción:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}
