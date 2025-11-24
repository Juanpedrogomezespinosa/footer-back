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
        model: "users",
        key: "id",
      },
    },
    productVariantStockId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "productVariantStockId",
      references: {
        model: "product_variant_stock",
        key: "id",
      },
    },
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
    // Ahora la unicidad es por usuario y variante específica
    indexes: [
      {
        unique: true,
        fields: ["userId", "productVariantStockId"],
        name: "cart_items_user_id_variant_id",
      },
    ],
  }
);

module.exports = CartItem;
