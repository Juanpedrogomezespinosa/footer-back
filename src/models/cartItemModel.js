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
      references: {
        model: "users", // Asumo que tu tabla de usuarios se llama 'users'
        key: "id",
      },
    },
    // --- ¡¡¡CAMBIO PRINCIPAL AQUÍ!!! ---
    // Eliminados 'productId' y 'size'
    productVariantStockId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "productVariantStockId",
      references: {
        model: "product_variant_stock", // Apunta a la tabla de variantes
        key: "id",
      },
    },
    // ---------------------------------
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: "cart_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    // --- ¡¡¡ÍNDICE ACTUALIZADO!!! ---
    // Ahora la unicidad es por usuario y variante específica
    indexes: [
      {
        unique: true,
        fields: ["userId", "productVariantStockId"],
        name: "cart_items_user_id_variant_id", // Nuevo nombre del índice
      },
    ],
  }
);

// --- RELACIONES ELIMINADAS ---
// Todas las asociaciones AHORA se manejan centralizadamente en 'src/models/index.js'
// para evitar este tipo de errores.

module.exports = CartItem;
