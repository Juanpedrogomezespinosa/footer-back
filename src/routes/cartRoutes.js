// src/routes/cartRoutes.js
const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const authMiddleware = require("../middlewares/authMiddleware");

// Todas las rutas necesitan token válido
router.use(authMiddleware);

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.put("/item/:itemId", cartController.updateCartItem);
router.delete("/item/:itemId", cartController.removeCartItem);

// LÍNEA ELIMINADA: router.post("/checkout", cartController.checkout);
// (La lógica de checkout ahora vive en orderController)

module.exports = router;
