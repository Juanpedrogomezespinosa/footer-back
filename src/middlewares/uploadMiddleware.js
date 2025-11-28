const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Asegurarse de que el directorio existe
// Usamos path.join para subir un nivel desde 'src/middlewares' a 'src/uploads'
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Carpeta 'uploads' asegurada en: " + uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Ruta absoluta para evitar confusiones
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp-random.ext
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Aceptar solo imágenes
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(
      new Error("¡No es una imagen! Por favor sube solo archivos de imagen."),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite aumentado a 10MB
  },
});

module.exports = upload;
