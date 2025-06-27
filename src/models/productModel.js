const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    size: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("hombre", "mujer", "unisex"),
      allowNull: true,
    },
    material: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    season: {
      type: DataTypes.ENUM("verano", "invierno", "otoño", "primavera"),
      allowNull: true,
    },
    is_new: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "products",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    underscored: true,
  }
);

module.exports = Product;
