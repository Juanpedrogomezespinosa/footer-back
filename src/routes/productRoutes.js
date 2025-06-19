const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} = require("../controllers/productController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// 📦 Rutas públicas
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// 🔒 Rutas protegidas (solo admin)
router.post("/", authMiddleware, roleMiddleware("admin"), createProduct);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateProduct);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteProduct);

// ✅ Nueva ruta: subida de imagen
router.post(
  "/:id/image",
  authMiddleware,
  roleMiddleware("admin"),
  upload.single("image"),
  uploadProductImage
);

module.exports = router;
