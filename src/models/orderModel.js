const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

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
    },
    addressId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Hacemos que sea obligatorio
      references: {
        model: "addresses", // Nombre de la tabla de direcciones
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM(
        "pendiente", // Creada, pendiente de pago
        "pagado", // Pagada (confirmada)
        "enviado",
        "entregado",
        "cancelado"
      ),
      defaultValue: "pendiente",
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "orders",
    timestamps: false,
  }
);

module.exports = Order;
