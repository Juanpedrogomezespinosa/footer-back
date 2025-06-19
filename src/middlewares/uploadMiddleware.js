const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ruta absoluta a la carpeta 'uploads' en la raíz del proyecto
const uploadsPath = path.join(__dirname, "..", "..", "uploads");

// Crea la carpeta si no existe
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Configuración del almacenamiento de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsPath); // 🟢 Guarda en la raíz, no en src
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

module.exports = upload;
