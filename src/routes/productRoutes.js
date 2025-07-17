const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  // uploadProductImage,  // Ya no se usa porque integramos la imagen en createProduct
} = require("../controllers/productController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// 📦 Rutas públicas
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// 🔒 Rutas protegidas (solo admin)
// Creación de producto con imagen incluida en el mismo request
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  upload.single("image"), // multer para recibir la imagen con campo 'image'
  createProduct
);

router.put("/:id", authMiddleware, roleMiddleware("admin"), updateProduct);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteProduct);

// Ya no hay ruta para subir imagen separada
// Si quieres eliminar esta ruta, simplemente comenta o borra este bloque:
// router.post(
//   "/:id/image",
//   authMiddleware,
//   roleMiddleware("admin"),
//   upload.single("image"),
//   uploadProductImage
// );

module.exports = router;
