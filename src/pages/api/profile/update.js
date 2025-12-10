import { getSession } from "next-auth/client";
import { connectToDatabase } from "../../../util/mongodb";
import { ObjectId } from "bson";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const session = await getSession({ req });

    if (!session || !session.user) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const { name, username, email, password, image } = req.body;

    if (!name && !username && !email && !password && !image) {
      return res.status(400).json({ message: "Al menos un campo debe ser actualizado" });
    }

    const { db } = await connectToDatabase();

    // Obtener el usuario actual
    const user = await db.collection("users").findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const updateData = {};

    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (image) updateData.image = image;

    // Si se cambia el email, verificar que no esté en uso
    if (email && email !== user.email) {
      const existingUser = await db.collection("users").findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "El correo electrónico ya está en uso" });
      }
      updateData.email = email;

      // Si el usuario es admin, actualizar la referencia en admins
      const adminExists = await db.collection("admins").findOne({ user: user.email });
      if (adminExists) {
        await db.collection("admins").updateOne(
          { user: user.email },
          { $set: { user: email } }
        );
      }
    }

    // Si se cambia la contraseña
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Verificar si el username ya está en uso por otro usuario
    if (username && username !== user.username) {
      const existingUser = await db.collection("users").findOne({
        _id: { $ne: user._id },
        username: username,
      });

      if (existingUser) {
        return res.status(400).json({ message: "El nombre de usuario ya está en uso" });
      }
    }

    updateData.updatedAt = new Date();

    // Actualizar el usuario
    const result = await db.collection("users").updateOne(
      { _id: user._id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json({
      message: "Perfil actualizado exitosamente",
      user: {
        name: updateData.name || user.name,
        username: updateData.username || user.username,
        email: updateData.email || user.email,
        image: updateData.image || user.image,
      },
    });
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

