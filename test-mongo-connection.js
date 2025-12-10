const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

console.log("🔍 Verificando configuración...");
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
    console.log("🔄 Intentando conectar a MongoDB...");
    
    // Extraer información de la URL
    const urlMatch = MONGODB_URI.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@(.+)/);
    if (urlMatch) {
      const [, username, password, host] = urlMatch;
      console.log(`   Usuario: ${username}`);
      console.log(`   Host: ${host}`);
      console.log(`   Base de datos: ${MONGODB_DB}`);
    }
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    };
    
    client = new MongoClient(MONGODB_URI, options);
    
    await client.connect();
    console.log("✅ ¡Conexión exitosa!");
    
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
    console.error("\n❌ Error de conexión:");
    console.error("   Tipo:", error.name);
    console.error("   Mensaje:", error.message);
    
    if (error.message.includes("authentication failed") || error.message.includes("bad auth")) {
      console.error("\n💡 SOLUCIÓN PARA 'bad auth: authentication failed':");
      console.error("\n1. Verifica en MongoDB Atlas → Database Access:");
      console.error("   - Que el usuario 'alien' exista");
      console.error("   - Que la contraseña sea correcta");
      console.error("   - Que tenga rol 'Atlas admin' o 'Read and write to any database'");
      console.error("\n2. Verifica en MongoDB Atlas → Network Access:");
      console.error("   - Agrega tu IP actual o 0.0.0.0/0 (para desarrollo)");
      console.error("   - Espera 1-2 minutos después de agregar la IP");
      console.error("\n3. Obtén la cadena de conexión correcta:");
      console.error("   - Ve a tu cluster → Connect → Connect your application");
      console.error("   - Copia la cadena completa");
      console.error("   - Reemplaza <password> con tu contraseña real");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Problema de red:");
      console.error("   - Verifica tu conexión a internet");
      console.error("   - Verifica que tu IP esté permitida en MongoDB Atlas");
    }
    
    return false;
  } finally {
    if (client) {
      await client.close();
      console.log("\n🔌 Conexión cerrada");
    }
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});

