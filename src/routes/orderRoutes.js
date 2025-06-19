const express = require("express");
const router = express.Router();
const { getOrderHistory } = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/history", authMiddleware, getOrderHistory);

module.exports = router;
