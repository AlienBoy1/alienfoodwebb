import { getSession } from "next-auth/client";
import { connectToDatabase } from "../../../util/mongodb";
import { ObjectId } from "bson";
import bcrypt from "bcryptjs";

export default async (req, res) => {
    try {
        const session = await getSession({ req });
        if (!session || !session.admin) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { db } = await connectToDatabase();

        // GET - Obtener todos los usuarios
        if (req.method === "GET") {
            let users = await db.collection("users").find({}).toArray();
            // Obtener lista de administradores
            const admins = await db.collection("admins").find({}).toArray();
            const adminEmails = new Set(admins.map(admin => admin.user));
            
            // No devolver las contraseñas y agregar campo isAdmin
            users = users.map(({ password, ...user }) => ({
                ...user,
                isAdmin: adminEmails.has(user.email)
            }));
            users = JSON.parse(JSON.stringify(users));
            return res.status(200).json(users);
        }

        // POST - Crear nuevo usuario
        if (req.method === "POST") {
            const { name, username, email, password, isAdmin } = req.body;

            if (!name || !username || !email || !password) {
                return res.status(400).json({ message: "Todos los campos son requeridos" });
            }

            if (password.length < 6) {
                return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
            }

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

            // Si se marca como admin, agregar a la colección de admins
            if (isAdmin) {
                await db.collection("admins").updateOne(
                    { user: email },
                    { 
                        $set: { user: email, createdAt: new Date() },
                        $setOnInsert: { createdAt: new Date() }
                    },
                    { upsert: true }
                );
            }

            return res.status(201).json({
                message: "Usuario creado exitosamente",
                userId: result.insertedId,
            });
        }

        // PUT - Actualizar usuario
        if (req.method === "PUT") {
            const { _id, name, username, email, password, isAdmin } = req.body;

            if (!_id) {
                return res.status(400).json({ message: "ID de usuario requerido" });
            }

            // Obtener el usuario actual para obtener el email
            const currentUser = await db.collection("users").findOne({ _id: ObjectId(_id) });
            if (!currentUser) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }

            const updateData = {};
            if (name) updateData.name = name;
            if (username) updateData.username = username;
            const newEmail = email || currentUser.email;
            if (email && email !== currentUser.email) {
                updateData.email = email;
            }
            if (password) {
                if (password.length < 6) {
                    return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
                }
                updateData.password = await bcrypt.hash(password, 10);
            }

            updateData.updatedAt = new Date();

            // Verificar si el username o email ya están en uso por otro usuario
            if (username || email) {
                const existingUser = await db.collection("users").findOne({
                    _id: { $ne: ObjectId(_id) },
                    $or: [
                        ...(username ? [{ username }] : []),
                        ...(email ? [{ email }] : []),
                    ],
                });

                if (existingUser) {
                    if (existingUser.username === username) {
                        return res.status(400).json({ message: "El nombre de usuario ya está en uso" });
                    }
                    if (existingUser.email === email) {
                        return res.status(400).json({ message: "El correo electrónico ya está en uso" });
                    }
                }
            }

            const result = await db.collection("users").updateOne(
                { _id: ObjectId(_id) },
                { $set: updateData }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }

            // Manejar el estado de administrador
            const oldEmail = currentUser.email;
            const finalEmail = email || oldEmail;

            // Si el email cambió, actualizar la referencia en admins
            if (email && email !== oldEmail) {
                const adminExists = await db.collection("admins").findOne({ user: oldEmail });
                if (adminExists) {
                    await db.collection("admins").updateOne(
                        { user: oldEmail },
                        { $set: { user: finalEmail } }
                    );
                }
            }

            // Actualizar estado de admin
            if (isAdmin === true || isAdmin === "true") {
                // Agregar como admin
                await db.collection("admins").updateOne(
                    { user: finalEmail },
                    { 
                        $set: { user: finalEmail },
                        $setOnInsert: { createdAt: new Date() }
                    },
                    { upsert: true }
                );
            } else if (isAdmin === false || isAdmin === "false") {
                // Remover como admin (pero no permitir remover al propio admin)
                if (finalEmail !== session.user.email) {
                    await db.collection("admins").deleteOne({ user: finalEmail });
                } else {
                    return res.status(400).json({ message: "No puedes remover tus propios privilegios de administrador" });
                }
            }

            return res.status(200).json({ message: "Usuario actualizado exitosamente" });
        }

        // DELETE - Eliminar usuario
        if (req.method === "DELETE") {
            const { _id } = req.body;

            if (!_id) {
                return res.status(400).json({ message: "ID de usuario requerido" });
            }

            // No permitir eliminar al propio administrador
            const user = await db.collection("users").findOne({ _id: ObjectId(_id) });
            if (user && user.email === session.user.email) {
                return res.status(400).json({ message: "No puedes eliminar tu propio usuario" });
            }

            const result = await db.collection("users").deleteOne({ _id: ObjectId(_id) });

            if (result.deletedCount === 0) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }

            // También eliminar suscripciones push del usuario
            await db.collection("pushSubscriptions").deleteMany({ userId: user?.email });

            // Eliminar de la colección de admins si es admin
            await db.collection("admins").deleteOne({ user: user?.email });

            return res.status(200).json({ message: "Usuario eliminado exitosamente" });
        }

        return res.status(405).json({ message: "Método no permitido" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
