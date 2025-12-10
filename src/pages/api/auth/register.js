import { connectToDatabase } from "../../../util/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { name, username, email, password, confirmPassword } = req.body;

    // Validaciones
    if (!name || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Las contraseñas no coinciden" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    const { db } = await connectToDatabase();

    // Verificar si el usuario ya existe
    const existingUser = await db.collection("users").findOne({
      $or: [{ username: username }, { email: email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: "El nombre de usuario ya está en uso" });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: "El correo electrónico ya está en uso" });
      }
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const result = await db.collection("users").insertOne({
      name,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return res.status(201).json({
      message: "Usuario registrado exitosamente",
      userId: result.insertedId,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    
    // Mensajes de error más específicos
    if (error.message && error.message.includes("authentication failed")) {
      return res.status(500).json({ 
        message: "Error de conexión con la base de datos. Verifica las credenciales de MongoDB." 
      });
    }
    
    if (error.message && error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      return res.status(500).json({ 
        message: "No se pudo conectar a la base de datos. Verifica tu conexión a internet y la configuración de MongoDB." 
      });
    }
    
    return res.status(500).json({ 
      message: error.message || "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

