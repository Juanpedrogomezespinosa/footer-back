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
  },
  {
    tableName: "cart_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

/**
 * Asocia el modelo CartItem con User y Product
 */
CartItem.associate = (models) => {
  CartItem.belongsTo(models.User, {
    foreignKey: "userId",
    as: "user",
  });

  CartItem.belongsTo(models.Product, {
    foreignKey: "productId",
    as: "product",
  });
};

module.exports = CartItem;
