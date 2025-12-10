import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

export async function connectToDatabase() {
  // Validar variables de entorno solo cuando se intenta conectar (no durante build)
  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable. " +
      "For local development, add it to .env.local. " +
      "For production, add it to Vercel environment variables."
    );
  }

  if (!MONGODB_DB) {
    throw new Error(
      "Please define the MONGODB_DB environment variable. " +
      "For local development, add it to .env.local. " +
      "For production, add it to Vercel environment variables."
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    };

    cached.promise = MongoClient.connect(MONGODB_URI, opts)
      .then((client) => {
      return {
        client,
        db: client.db(MONGODB_DB),
      };
      })
      .catch((error) => {
        // Limpiar la promesa en caso de error para permitir reintentos
        cached.promise = null;
        console.error("Error conectando a MongoDB:", error.message);
        throw error;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
