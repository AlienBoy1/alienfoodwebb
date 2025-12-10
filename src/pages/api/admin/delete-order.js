import { ObjectId } from "bson";
import { getSession } from "next-auth/client";
import { connectToDatabase } from "../../../util/mongodb";

export default async (req, res) => {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ message: "Método no permitido" });
        }

        const session = await getSession({ req });
        if (!session || !session.admin) {
            return res.status(401).json({ message: "No autorizado" });
        }

        const { _id } = req.body;

        if (!_id) {
            return res.status(400).json({ message: "ID de pedido requerido" });
        }

        const { db } = await connectToDatabase();

        // Verificar que el pedido existe
        const order = await db.collection("orders").findOne({ _id: ObjectId(_id) });

        if (!order) {
            return res.status(404).json({ message: "Pedido no encontrado" });
        }

        // Eliminar el pedido
        const result = await db.collection("orders").deleteOne({ _id: ObjectId(_id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Pedido no encontrado" });
        }

        return res.status(200).json({ message: "Pedido eliminado exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};

