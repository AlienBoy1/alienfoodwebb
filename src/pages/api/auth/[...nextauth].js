import NextAuth from "next-auth";
import Providers from "next-auth/providers";
import { connectToDatabase } from "../../../util/mongodb";
import bcrypt from "bcryptjs";

export default NextAuth({
  providers: [
    Providers.Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { db } = await connectToDatabase();
          const user = await db.collection("users").findOne({
            username: credentials.username,
          });

          if (!user) {
            throw new Error("Usuario no encontrado");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) {
            throw new Error("Contraseña incorrecta");
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            username: user.username,
            image: user.image || null,
          };
        } catch (error) {
          console.error("Error en autorización:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async session(session, token) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.image;
      }

      // Obtener la imagen actualizada del usuario desde la base de datos
      const { db } = await connectToDatabase();
      const user = await db.collection("users").findOne({ email: session.user.email });
      if (user && user.image) {
        session.user.image = user.image;
      }

      session.admin = false;
      const result = await db
        .collection("admins")
        .findOne({ user: session.user.email });
      if (result) {
        session.admin = true;
      }
      return session;
    },
    async jwt(token, user, account) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  theme: "dark",
});
