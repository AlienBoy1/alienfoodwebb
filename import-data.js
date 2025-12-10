const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI || !MONGODB_DB) {
  console.error("❌ Error: MONGODB_URI y MONGODB_DB deben estar configurados en .env.local");
  process.exit(1);
}

async function importData() {
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
    
    // Leer el archivo dishes.json
    console.log("📖 Leyendo dishes.json...");
    const dishesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "dishes.json"), "utf8")
    );
    
    // Limpiar colecciones existentes (opcional)
    console.log("🧹 Limpiando colecciones existentes...");
    await db.collection("dishes").deleteMany({});
    await db.collection("categories").deleteMany({});
    
    // Insertar platos
    console.log(`📝 Insertando ${dishesData.length} platos...`);
    await db.collection("dishes").insertMany(dishesData);
    console.log("✅ Platos insertados correctamente");
    
    // Extraer categorías únicas
    const categoriesSet = new Set(dishesData.map((dish) => dish.category));
    const categories = Array.from(categoriesSet).map((category) => ({
      name: category,
    }));
    
    // Insertar categorías
    console.log(`📝 Insertando ${categories.length} categorías...`);
    await db.collection("categories").insertMany(categories);
    console.log("✅ Categorías insertadas correctamente");
    
    console.log("\n🎉 ¡Importación completada exitosamente!");
    console.log(`   - ${dishesData.length} platos importados`);
    console.log(`   - ${categories.length} categorías importadas`);
    
  } catch (error) {
    console.error("❌ Error durante la importación:", error.message);
    if (error.message.includes("authentication")) {
      console.error("\n💡 Verifica tus credenciales de MongoDB en .env.local");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Verifica tu URL de conexión de MongoDB y que tu IP esté permitida en MongoDB Atlas");
    }
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log("🔌 Conexión cerrada");
    }
  }
}

importData();

