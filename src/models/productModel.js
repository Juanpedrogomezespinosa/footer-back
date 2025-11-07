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
      type: DataTypes.ENUM("zapatillas", "ropa", "complementos"),
      allowNull: false,
      validate: {
        notNull: {
          msg: "La categoría no puede ser nula.",
        },
        notEmpty: {
          msg: "La categoría no puede estar vacía.",
        },
        isIn: {
          args: [["zapatillas", "ropa", "complementos"]],
          msg: "Categoría inválida. Debe ser 'zapatillas', 'ropa' o 'complementos'.",
        },
      },
    },
    sub_category: {
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
    // --- ¡CAMBIO IMPORTANTE! ---
    // La columna 'image' se elimina de este modelo.
    // La gestionaremos a través de la tabla 'product_images'.
    /*
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    */
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

/**
 * --- ¡NUEVO! Asociación ---
 * Aquí definimos la relación "Uno a Muchos" a nivel de modelo.
 * Le decimos a Sequelize que 'Product' puede tener muchas 'ProductImages'.
 */
Product.associate = (models) => {
  Product.hasMany(models.ProductImage, {
    foreignKey: "productId",
    as: "images", // Este 'as' (alias) es CLAVE. Lo usaremos en el controlador.
  });
};

module.exports = Product;
