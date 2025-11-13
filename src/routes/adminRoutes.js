// src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();

// Controladores
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productController");
const userController = require("../controllers/userController");

// Middlewares
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// --- ¡IMPORTANTE! ---
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

// --- Rutas de Estadísticas ---
router.get("/stats/dashboard", adminController.getDashboardStats);
router.get("/stats/sales-graph", adminController.getSalesGraphData);

// --- Rutas de Gestión de Pedidos ---
router.get("/orders", adminController.getAllOrders);
router.get("/orders/:id", adminController.getAdminOrderById);
router.put("/orders/:id/status", adminController.updateOrderStatus);

// --- Rutas de Gestión de Usuarios ---
// ¡CORREGIDO! Apunta a userController para la búsqueda
router.get("/users", userController.getAllUsers);
router.delete("/users/:id", userController.deleteUser);

// --- ¡¡¡NUEVA RUTA!!! ---
// (Esta sí usa el adminController, donde pusimos la lógica)
router.get("/users/:id", adminController.getAdminUserById);

// --- Rutas de Gestión de Productos ---
// (Estas rutas no existen en adminRoutes, están en productRoutes,
// pero las dejo como estaban en tu archivo)
router.get("/products", productController.getAllProducts);
router.post(
  "/products",
  upload.array("images", 10),
  productController.createProduct
);
router.put(
  "/products/:id",
  upload.array("images", 10),
  productController.updateProduct
);
router.delete("/products/:id", productController.deleteProduct);

module.exports = router;
