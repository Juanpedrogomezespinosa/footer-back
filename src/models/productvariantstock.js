const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

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
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      comment:
        "Precio específico de la variante. Si es 0, usa el precio base del producto.",
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

// Exportamos el modelo ya inicializado
module.exports = ProductVariantStock;
