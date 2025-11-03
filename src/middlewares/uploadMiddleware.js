const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Carpeta uploads dentro de src (misma que en app.js)
const uploadsPath = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log(
    "📁 Carpeta 'uploads' creada automáticamente dentro de src (uploadMiddleware)."
  );
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // límite 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    // 🆕 Pequeña mejora: Pasar el error como un objeto Error
    cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, gif)"));
  },
});

module.exports = upload;
