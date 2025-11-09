// src/models/productvariantstock.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // <-- Importa sequelize

// Define el modelo directamente
const ProductVariantStock = sequelize.define(
  "ProductVariantStock",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products", // Nombre de la tabla
        key: "id",
      },
      onDelete: "CASCADE",
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.STRING, // Ej: "36", "S", "Única"
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "product_variant_stock", // Nombre de la tabla en DB
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["product_id", "color", "size"], // Variante única
      },
    ],
  }
);

// YA NO HAY FUNCIÓN .associate() AQUÍ

// Exportamos el modelo ya inicializado
module.exports = ProductVariantStock;
