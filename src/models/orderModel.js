const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
// const User = require("./userModel"); // Ya no es necesario aquí

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
    // --- ¡NUEVO CAMPO AÑADIDO! ---
    addressId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Hacemos que sea obligatorio
      references: {
        model: "addresses", // Nombre de la tabla de direcciones
        key: "id",
      },
    },
    // --- FIN DEL NUEVO CAMPO ---
    status: {
      // He ampliado los estados para el nuevo flujo
      type: DataTypes.ENUM(
        "pendiente", // Creada, pendiente de pago
        "pagado", // Pagada (confirmada)
        "enviado",
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

// --- RELACIONES ELIMINADAS ---
// Las relaciones 'Order.belongsTo(User)' y 'User.hasMany(Order)'
// se han eliminado de aquí porque ya están (y deben estar)
// centralizadas en 'src/models/index.js'.

module.exports = Order;
