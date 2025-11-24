// src/scripts/deleteAllProducts.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const fs = require("fs");
const { sequelize } = require("../models"); // Importamos la conexión y modelos

// Ruta a la carpeta de subidas
const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

async function cleanUploadsFolder() {
  console.log("🗑️  Limpiando carpeta de imágenes (uploads)...");

  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      console.log("   La carpeta uploads no existe, saltando...");
      return;
    }

    const files = fs.readdirSync(UPLOADS_DIR);
    let deletedCount = 0;

    files.forEach((file) => {
      // Evitar borrar archivos de sistema o ocultos si los hay
      if (
        file === ".gitignore" ||
        file === ".DS_Store" ||
        file.startsWith("default")
      ) {
        return;
      }

      const filePath = path.join(UPLOADS_DIR, file);
      fs.unlinkSync(filePath);
      deletedCount++;
    });

    console.log(`   ✅ Eliminados ${deletedCount} archivos físicos.`);
  } catch (error) {
    console.error("   ❌ Error limpiando carpeta uploads:", error.message);
  }
}

async function main() {
  console.log("\n☢️  INICIANDO BORRADO TOTAL DE PRODUCTOS ☢️");
  console.log("============================================");

  try {
    // Conectar a la BD
    await sequelize.authenticate();
    console.log("✅ Conexión a BD establecida.");

    // 1. Desactivar restricciones de clave foránea temporalmente
    // Esto es necesario en MySQL para hacer TRUNCATE (borrado rápido y total)
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    // 2. Vaciar tablas relacionadas con productos
    // El orden no importa tanto al desactivar FK checks, pero es buena práctica
    console.log("🗑️  Vaciando tabla 'product_variant_stock'...");
    await sequelize.query("TRUNCATE TABLE product_variant_stock");

    console.log("🗑️  Vaciando tabla 'product_images'...");
    await sequelize.query("TRUNCATE TABLE product_images");

    console.log("🗑️  Vaciando tabla 'ratings' (valoraciones)...");
    await sequelize.query("TRUNCATE TABLE ratings");

    console.log(
      "🗑️  Vaciando tabla 'cart_items' (para evitar carritos huérfanos)..."
    );
    await sequelize.query("TRUNCATE TABLE cart_items");

    console.log(
      "🗑️  Vaciando tabla 'order_items' (opcional, si quieres mantener pedidos no borres esto)..."
    );
    // Si quieres mantener el historial de pedidos aunque borres los productos, comenta la siguiente línea
    // Pero dejar pedidos apuntando a productos que no existen puede dar error en el panel de admin
    await sequelize.query("TRUNCATE TABLE order_items");

    console.log("🗑️  Vaciando tabla 'products'...");
    await sequelize.query("TRUNCATE TABLE products");

    // 3. Reactivar restricciones
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("✅ Base de datos limpia.");

    // 4. Limpiar archivos físicos
    await cleanUploadsFolder();

    console.log("\n✨ ¡TODO ELIMINADO CORRECTAMENTE! ✨");
    console.log("   Tu tienda está vacía y lista para un nuevo seed.");
  } catch (error) {
    console.error("\n❌ ERROR FATAL:", error);
  } finally {
    await sequelize.close();
  }
}

main();
