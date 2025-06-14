const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.put("/item/:itemId", cartController.updateCartItem);
router.delete("/item/:itemId", cartController.removeCartItem);
router.post("/checkout", cartController.checkout);

module.exports = router;
