// src/models/productModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // 1. Importar la instancia de Sequelize

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    // CAMPO ELIMINADO: 'stock'
    // CAMPO ELIMINADO: 'size'
    color: {
      // SÍ mantenemos 'color' para el color principal/agrupador
      type: DataTypes.STRING,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM("zapatillas", "ropa", "complementos"),
      allowNull: false,
    },
    sub_category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("hombre", "mujer", "unisex"),
      allowNull: true,
    },
    material: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    season: {
      type: DataTypes.ENUM("verano", "primavera", "otoño", "invierno", "todas"),
      allowNull: true,
      defaultValue: "todas",
    },
    is_new: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // --- ¡¡¡AÑADIDO PARA BORRADO LÓGICO!!! ---
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // Por defecto, todos los productos están activos
    },
    // ----------------------------------------
  },
  {
    tableName: "products",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// ELIMINADA TODA LA FUNCIÓN .associate()
// index.js se encargará de esto.

module.exports = Product;
