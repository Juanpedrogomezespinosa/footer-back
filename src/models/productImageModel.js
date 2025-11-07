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
        model: "products", // Nombre de la tabla de productos
        key: "id",
      },
      onDelete: "CASCADE",
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Ruta pública de la imagen (ej: /uploads/imagen.png)",
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
    // --- ¡ESTA ES LA CORRECCIÓN! ---
    // Esto le dice a Sequelize que mapee
    // productId -> product_id
    // imageUrl -> image_url
    // displayOrder -> display_order
    // (tal como lo creamos en Workbench)
    underscored: true,
  }
);

module.exports = ProductImage;
