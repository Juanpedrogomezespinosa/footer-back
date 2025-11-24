const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ProductImage = sequelize.define(
  "ProductImage",
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
        model: "products",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Ruta pública de la imagen (ej: /uploads/imagen.png)",
    },
    variantColor: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment:
        "Color de la variante a la que pertenece esta imagen (ej: 'Rojo'). Null si es genérica.",
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    tableName: "product_images",
    timestamps: false,
    underscored: true,
  }
);

module.exports = ProductImage;
