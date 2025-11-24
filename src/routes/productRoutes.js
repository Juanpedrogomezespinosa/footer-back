const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts, // <-- 1. IMPORTAR LA NUEVA FUNCIÓN
} = require("../controllers/productController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware"); // Importamos la base de Multer

//  Rutas públicas
router.get("/", getAllProducts);

// Debe ir ANTES de '/:id' para que 'related' no sea tratado como un id
router.get("/:id/related", getRelatedProducts);
// ----------------------------

router.get("/:id", getProductById); // Esta ruta ahora va después

//  Rutas protegidas (solo admin)
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  upload.array("images", 10),
  createProduct
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  upload.array("images", 10),
  updateProduct
);

router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteProduct);

module.exports = router;
