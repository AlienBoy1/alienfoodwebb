const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

console.log("🔍 Información de conexión:");
console.log("MONGODB_URI:", MONGODB_URI ? MONGODB_URI.replace(/:[^:@]+@/, ':****@') : "NO DEFINIDA");
console.log("MONGODB_DB:", MONGODB_DB || "NO DEFINIDA");
console.log("");

if (!MONGODB_URI || !MONGODB_DB) {
  console.error("❌ Error: Variables de entorno no configuradas");
  process.exit(1);
}

async function testConnection() {
  let client;
  try {
    console.log("🔄 Intentando conectar...");
    
    // Intentar con diferentes opciones de conexión
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    };
    
    client = new MongoClient(MONGODB_URI, options);
    
    await client.connect();
    console.log("✅ Conexión exitosa!");
    
    // Probar acceso a la base de datos
    const db = client.db(MONGODB_DB);
    const collections = await db.listCollections().toArray();
    console.log(`✅ Base de datos '${MONGODB_DB}' accesible`);
    console.log(`📁 Colecciones encontradas: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log("   Colecciones:", collections.map(c => c.name).join(", "));
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error de conexión:");
    console.error("   Tipo:", error.name);
    console.error("   Mensaje:", error.message);
    
    if (error.message.includes("authentication")) {
      console.error("\n💡 Posibles soluciones:");
      console.error("   1. Verifica que el usuario y contraseña sean correctos");
      console.error("   2. Verifica que tu IP esté permitida en MongoDB Atlas");
      console.error("   3. Verifica que el usuario tenga los permisos necesarios");
      console.error("   4. Si la contraseña tiene caracteres especiales, codifícala en URL");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Problema de red:");
      console.error("   1. Verifica tu conexión a internet");
      console.error("   2. Verifica que tu IP esté permitida en MongoDB Atlas");
    }
    
    return false;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});

