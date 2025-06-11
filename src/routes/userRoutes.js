const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  deleteUser,
} = require("../controllers/userController");

const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, getAllUsers);
router.get("/:id", authMiddleware, getUserById);
router.delete("/:id", authMiddleware, deleteUser);

module.exports = router;
