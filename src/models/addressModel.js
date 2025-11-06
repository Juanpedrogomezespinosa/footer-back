const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Address = sequelize.define(
  "Address",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Clave foránea que lo vincula al usuario
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users", // Nombre de la tabla de usuarios
        key: "id",
      },
    },
    // Un alias para la dirección, ej: "Casa", "Oficina"
    alias: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    street: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    // Para marcar una dirección como la principal para envíos
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "addresses",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at", // A diferencia de User, aquí sí queremos updatedAt
  }
);

module.exports = Address;
