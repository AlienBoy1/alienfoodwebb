const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI || !MONGODB_DB) {
  console.error("❌ Error: MONGODB_URI y MONGODB_DB deben estar configurados en .env.local");
  process.exit(1);
}

async function setupAdmin() {
  let client;
  try {
    console.log("🔄 Conectando a MongoDB...");
    client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    
    await client.connect();
    console.log("✅ Conectado a MongoDB");
    
    const db = client.db(MONGODB_DB);
    
    // Verificar si el usuario ya existe
    const existingUser = await db.collection("users").findOne({
      username: "Alien",
    });
    
    if (existingUser) {
      console.log("⚠️  El usuario 'Alien' ya existe. Actualizando contraseña...");
      const hashedPassword = await bcrypt.hash("Alien1", 10);
      await db.collection("users").updateOne(
        { username: "Alien" },
        { 
          $set: { 
            password: hashedPassword,
            name: "Administrador",
            email: "admin@zinger.com"
          } 
        }
      );
      console.log("✅ Contraseña actualizada");
    } else {
      // Crear el usuario administrador
      console.log("📝 Creando usuario administrador...");
      const hashedPassword = await bcrypt.hash("Alien1", 10);
      
      await db.collection("users").insertOne({
        name: "Administrador",
        username: "Alien",
        email: "admin@zinger.com",
        password: hashedPassword,
        createdAt: new Date(),
      });
      console.log("✅ Usuario administrador creado");
    }
    
    // Agregar a la colección de administradores
    const existingAdmin = await db.collection("admins").findOne({
      user: "admin@zinger.com",
    });
    
    if (!existingAdmin) {
      console.log("📝 Agregando a la colección de administradores...");
      await db.collection("admins").insertOne({
        user: "admin@zinger.com",
        createdAt: new Date(),
      });
      console.log("✅ Administrador agregado a la colección de admins");
    } else {
      console.log("✅ El administrador ya está en la colección de admins");
    }
    
    console.log("\n🎉 ¡Configuración completada exitosamente!");
    console.log("\n📋 Credenciales del administrador:");
    console.log("   Username: Alien");
    console.log("   Password: Alien1");
    console.log("   Email: admin@zinger.com");
    
  } catch (error) {
    console.error("❌ Error durante la configuración:", error.message);
    if (error.message.includes("authentication")) {
      console.error("\n💡 Verifica tus credenciales de MongoDB en .env.local");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Verifica tu URL de conexión de MongoDB y que tu IP esté permitida en MongoDB Atlas");
    }
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log("\n🔌 Conexión cerrada");
    }
  }
}

setupAdmin();

