const express = require("express");
const router = express.Router();

const {
  createOrUpdateRating,
  getRatingsByProduct,
  updateRating,
  deleteRating,
} = require("../controllers/ratingController");
const authenticationMiddleware = require("../middlewares/authMiddleware");

// Crear o actualizar valoración (requiere login)
router.post("/", authenticationMiddleware, createOrUpdateRating);

// Obtener valoraciones de un producto
router.get("/product/:productId", getRatingsByProduct);

// Actualizar valoración específica por ID (requiere login)
router.put("/:id", authenticationMiddleware, updateRating);

// Eliminar valoración específica por ID (requiere login)
router.delete("/:id", authenticationMiddleware, deleteRating);

module.exports = router;
