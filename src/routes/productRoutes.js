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

// 📦 Rutas públicas (acceso sin autenticación)
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// 🔒 Rutas protegidas (solo admin)
router.post("/", authMiddleware, roleMiddleware("admin"), createProduct);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateProduct);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteProduct);

module.exports = router;
