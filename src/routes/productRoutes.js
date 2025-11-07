const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware"); // Importamos la base de Multer

// 📦 Rutas públicas (sin cambios)
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// 🔒 Rutas protegidas (solo admin)

// --- ¡CAMBIO IMPORTANTE! ---
// Ahora usamos 'upload.array("images", 10)'
// Esto aceptará hasta 10 ficheros bajo el nombre de campo 'images'
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  upload.array("images", 10), // <-- CAMBIADO DE .single("image")
  createProduct
);

// --- ¡CAMBIO IMPORTANTE! ---
// La ruta PUT también aceptará un array de 'images'
// (En el frontend, decidiremos si enviamos imágenes nuevas o no)
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  upload.array("images", 10), // <-- CAMBIADO (antes no tenía multer aquí)
  updateProduct
);

router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteProduct);

module.exports = router;
