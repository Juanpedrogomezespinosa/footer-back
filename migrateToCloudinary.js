const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const { sequelize, ProductImage } = require("./src/models"); // Ajusta si tus modelos están en otra ruta
require("dotenv").config();

// 1. Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOADS_PATH = path.join(__dirname, "src/uploads");

async function migrateImages() {
  try {
    console.log("🚀 Iniciando conexión a la base de datos...");
    await sequelize.authenticate();
    console.log("✅ Conectado a la BD.");

    // 2. Obtener todas las imágenes de la base de datos
    // Asumo que usas el modelo ProductImage. Si las fotos están en Product, cambia "ProductImage" por "Product".
    const images = await ProductImage.findAll();
    console.log(`📊 Total de imágenes encontradas en BD: ${images.length}`);

    let successCount = 0;
    let errorCount = 0;

    for (const imgRecord of images) {
      const currentUrl = imgRecord.imageUrl; // O el campo donde guardes la ruta (ej: 'image')

      // Si ya es una URL de Cloudinary o externa, la saltamos
      if (currentUrl.startsWith("http")) {
        console.log(`⏭️  Saltando imagen ya migrada: ${imgRecord.id}`);
        continue;
      }

      // 3. Buscar el archivo en local
      // A veces la BD guarda "uploads/foto.jpg" y otras veces solo "foto.jpg"
      // Limpiamos la ruta para obtener solo el nombre del archivo
      const filename = path.basename(currentUrl);
      const localFilePath = path.join(UPLOADS_PATH, filename);

      if (fs.existsSync(localFilePath)) {
        try {
          console.log(`cloud_upload Subiendo: ${filename}...`);

          // 4. Subir a Cloudinary
          const result = await cloudinary.uploader.upload(localFilePath, {
            folder: "footer-products", // La carpeta en Cloudinary
            use_filename: true,
            unique_filename: false,
          });

          // 5. Actualizar la BD con la nueva URL remota
          imgRecord.imageUrl = result.secure_url;
          await imgRecord.save();

          console.log(
            `✅ Actualizado ID ${imgRecord.id} -> ${result.secure_url}`
          );
          successCount++;
        } catch (uploadError) {
          console.error(`❌ Error subiendo ${filename}:`, uploadError.message);
          errorCount++;
        }
      } else {
        console.warn(
          `⚠️ Archivo local no encontrado para ID ${imgRecord.id}: ${localFilePath}`
        );
        errorCount++;
      }
    }

    console.log("------------------------------------------------");
    console.log("🏁 Migración finalizada.");
    console.log(`✅ Éxitos: ${successCount}`);
    console.log(`❌ Errores/No encontrados: ${errorCount}`);
  } catch (error) {
    console.error("❌ Error general en el script:", error);
  } finally {
    await sequelize.close();
  }
}

migrateImages();
