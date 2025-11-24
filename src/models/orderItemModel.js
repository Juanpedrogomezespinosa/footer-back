const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

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
    productVariantStockId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "product_variant_stock", // Apunta a la tabla de variantes
        key: "id",
      },
    },
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
    indexes: [
      {
        unique: true,
        fields: ["orderId", "productVariantStockId"],
        name: "order_items_orderId_variant_id",
      },
    ],
  }
);

module.exports = OrderItem;
