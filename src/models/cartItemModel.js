// src/models/cartItemModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CartItem = sequelize.define(
  "CartItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "userId",
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "productId",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    // --- ¡CAMPO AÑADIDO! ---
    size: {
      type: DataTypes.STRING,
      allowNull: true, // Permite nulo para productos sin talla (ej: gorra)
    },
  },
  {
    tableName: "cart_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    // --- ¡ÍNDICE AÑADIDO! ---
    // Evita duplicados (un usuario no puede tener el mismo producto/talla dos veces)
    indexes: [
      {
        unique: true,
        fields: ["userId", "productId", "size"],
      },
    ],
  }
);

// --- FUNCIÓN .associate() ELIMINADA ---
// Tu fichero index.js ya se encarga de esto.

module.exports = CartItem;
