const { sequelize, Address } = require("../models"); // Importamos Address y sequelize

/**
 * Obtener todas las direcciones del usuario autenticado
 */
exports.getAllAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id; // Obtenido del authMiddleware

    const addresses = await Address.findAll({
      where: { userId },
      order: [
        ["isDefault", "DESC"], // Mostrar la de por defecto primero
        ["created_at", "ASC"],
      ],
    });

    res.status(200).json(addresses);
  } catch (error) {
    next(error);
  }
};

/**
 * Crear una nueva dirección
 */
exports.createAddress = async (req, res, next) => {
  const t = await sequelize.transaction(); // Iniciar transacción
  try {
    const userId = req.user.id;
    const {
      alias,
      street,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
    } = req.body;

    // --- VALIDACIÓN DE TELÉFONO ---
    if (!phone || phone.trim() === "") {
      await t.rollback();
      return res.status(400).json({
        message: "El número de teléfono es obligatorio para realizar envíos.",
      });
    }
    // ------------------------------

    // Lógica de "isDefault": Si esta es la nueva por defecto,
    // desmarcar todas las demás para este usuario.
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId }, transaction: t }
      );
    }

    // Crear la nueva dirección
    const newAddress = await Address.create(
      {
        userId,
        alias,
        street,
        city,
        state,
        postalCode,
        country,
        phone,
        isDefault,
      },
      { transaction: t }
    );

    await t.commit(); // Confirmar la transacción
    res.status(201).json(newAddress);
  } catch (error) {
    await t.rollback(); // Revertir en caso de error
    next(error);
  }
};

/**
 * Actualizar una dirección existente
 */
exports.updateAddress = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { id } = req.params; // ID de la dirección a actualizar
    const {
      alias,
      street,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
    } = req.body;

    // --- VALIDACIÓN DE TELÉFONO ---
    if (!phone || phone.trim() === "") {
      await t.rollback();
      return res.status(400).json({
        message: "El número de teléfono es obligatorio para realizar envíos.",
      });
    }
    // ------------------------------

    // 1. Lógica de "isDefault" (igual que en create)
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId }, transaction: t }
      );
    }

    // 2. Actualizar la dirección
    const [affectedRows] = await Address.update(
      {
        alias,
        street,
        city,
        state,
        postalCode,
        country,
        phone,
        isDefault,
      },
      {
        where: { id, userId }, // ¡Importante! Asegurarse que el usuario es el dueño
        transaction: t,
      }
    );

    if (affectedRows === 0) {
      await t.rollback();
      return res.status(404).json({
        message: "Dirección no encontrada o no pertenece al usuario.",
      });
    }

    await t.commit();

    // Devolver la dirección actualizada
    const updatedAddress = await Address.findOne({ where: { id } });
    res.status(200).json(updatedAddress);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Eliminar una dirección
 */
exports.deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // ID de la dirección a eliminar

    const affectedRows = await Address.destroy({
      where: {
        id,
        userId, // ¡Importante! Solo puede borrar sus propias direcciones
      },
    });

    if (affectedRows === 0) {
      return res.status(404).json({
        message: "Dirección no encontrada o no pertenece al usuario.",
      });
    }

    res.status(204).send(); // 204 No Content (Éxito sin respuesta)
  } catch (error) {
    next(error);
  }
};
