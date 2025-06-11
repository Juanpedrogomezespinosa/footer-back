const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = require("./userModel");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    status: {
      type: DataTypes.ENUM("pendiente", "pagado", "enviado", "cancelado"),
      defaultValue: "pendiente",
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    tableName: "orders",
    timestamps: false,
  }
);

module.exports = Order;
