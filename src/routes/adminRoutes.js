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
// Aplicamos la autenticación y el rol de 'admin'
// a TODAS las rutas definidas en este fichero.
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

// --- Rutas de Estadísticas ---
router.get("/stats/dashboard", adminController.getDashboardStats);
router.get("/stats/sales-graph", adminController.getSalesGraphData);

// --- Rutas de Gestión de Pedidos ---
router.get("/orders", adminController.getAllOrders);
// --- ¡NUEVA RUTA AÑADIDA! ---
router.get("/orders/:id", adminController.getAdminOrderById);

// --- Rutas de Gestión de Usuarios ---
router.get("/users", userController.getAllUsers);
router.delete("/users/:id", userController.deleteUser);

// --- Rutas de Gestión de Productos ---
// (Estas rutas ya las tenías, pero las centralizamos aquí
// para que el frontend del admin las tenga en un solo lugar)
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
