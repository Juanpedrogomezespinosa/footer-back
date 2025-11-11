// src/models/orderItemModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
// const Order = require("./orderModel"); // <-- Eliminadas importaciones
// const Product = require("./productModel"); // <-- Eliminadas importaciones

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "orders", // Apunta a la tabla de pedidos
        key: "id",
      },
    },
    // --- ¡¡¡CAMBIO PRINCIPAL AQUÍ!!! ---
    // Eliminado 'productId'
    productVariantStockId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "order_items",
    timestamps: false,
    // --- ¡¡¡ÍNDICE AÑADIDO/ACTUALIZADO!!! ---
    // Para que coincida con tu BBDD
    indexes: [
      {
        unique: true,
        fields: ["orderId", "productVariantStockId"],
        name: "order_items_orderId_variant_id", // Nuevo nombre del índice
      },
    ],
  }
);

// --- RELACIONES ELIMINADAS ---
// Todas las asociaciones AHORA se manejan centralizadamente en 'src/models/index.js'
// OrderItem.belongsTo(Order, { foreignKey: "orderId" });
// Order.hasMany(OrderItem, { foreignKey: "orderId" });
// OrderItem.belongsTo(Product, { foreignKey: "productId" });
// Product.hasMany(OrderItem, { foreignKey: "productId" });

module.exports = OrderItem;
