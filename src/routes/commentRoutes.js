const express = require("express");
const router = express.Router();

const {
  createComment,
  getCommentsByProduct,
  deleteComment,
} = require("../controllers/commentController");

const authMiddleware = require("../middlewares/authMiddleware");

// Crear comentario (usuario autenticado)
router.post("/", authMiddleware, createComment);

// Obtener comentarios de un producto (público)
router.get("/product/:productId", getCommentsByProduct);

// Eliminar comentario (solo autor autenticado)
router.delete("/:id", authMiddleware, deleteComment);

module.exports = router;
