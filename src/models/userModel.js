// src/models/userModel.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true, // <-- MODIFICADO (antes era 'false')
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("admin", "client"),
      allowNull: false,
      defaultValue: "client",
    },
    // --- 👇 NUEVO CAMPO AÑADIDO ---
    googleId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    // --- FIN DE NUEVO CAMPO ---
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = User;
