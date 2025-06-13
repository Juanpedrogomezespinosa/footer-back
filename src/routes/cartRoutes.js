const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const authMiddleware = require("../middlewares/authMiddleware");

// Todas las rutas protegidas, requiere token válido
router.use(authMiddleware);

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.post("/checkout", cartController.checkout);

module.exports = router;
