const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const authMiddleware = require("../middlewares/authMiddleware");

// Aplicamos el middleware de autenticación a TODAS las rutas de direcciones
router.use(authMiddleware);

// GET /api/addresses - Obtener todas las direcciones del usuario
router.get("/", addressController.getAllAddresses);

// POST /api/addresses - Crear una nueva dirección
router.post("/", addressController.createAddress);

// PUT /api/addresses/:id - Actualizar una dirección específica
router.put("/:id", addressController.updateAddress);

// DELETE /api/addresses/:id - Eliminar una dirección específica
router.delete("/:id", addressController.deleteAddress);

module.exports = router;
