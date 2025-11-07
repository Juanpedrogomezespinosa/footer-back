const sequelize = require("../config/db");

const User = require("./userModel");
const Product = require("./productModel");
const Order = require("./orderModel");
const OrderItem = require("./orderItemModel");
const CartItem = require("./cartItemModel");
const Comment = require("./commentModel");
const Rating = require("./ratingModel");
const Address = require("./addressModel");
// --- 1. IMPORTAR EL NUEVO MODELO DE IMAGEN ---
const ProductImage = require("./productImageModel");

const models = {
  User,
  Product,
  Order,
  OrderItem,
  CartItem,
  Comment,
  Rating,
  Address,
  ProductImage, // --- 2. AÑADIR EL MODELO AL OBJETO ---
};

// Ejecutar métodos associate definidos en cada modelo (si existen)
// ¡Esta sección ahora ejecutará el Product.associate que definimos!
Object.values(models).forEach((model) => {
  if (typeof model.associate === "function") {
    model.associate(models);
  }
});

/**
 * Asociaciones explícitas
 */

// ... (todas tus asociaciones existentes: User-Order, Order-Item, etc.)
User.hasMany(Order, { foreignKey: "userId", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "userId" });

Order.hasMany(OrderItem, { foreignKey: "orderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

Product.hasMany(OrderItem, { foreignKey: "productId" });
OrderItem.belongsTo(Product, { foreignKey: "productId" });

Order.belongsToMany(Product, {
  through: OrderItem,
  foreignKey: "orderId",
  otherKey: "productId",
});
Product.belongsToMany(Order, {
  through: OrderItem,
  foreignKey: "productId",
  otherKey: "orderId",
});

User.hasMany(CartItem, { foreignKey: "userId", onDelete: "CASCADE" });
CartItem.belongsTo(User, { foreignKey: "userId" });

Product.hasMany(CartItem, { foreignKey: "productId" });
CartItem.belongsTo(Product, { foreignKey: "productId" });

User.hasMany(Comment, { foreignKey: "userId", onDelete: "CASCADE" });
Comment.belongsTo(User, { foreignKey: "userId" });

Product.hasMany(Comment, { foreignKey: "productId", onDelete: "CASCADE" });
Comment.belongsTo(Product, { foreignKey: "productId" });

User.hasMany(Rating, { foreignKey: "userId", onDelete: "CASCADE" });
Rating.belongsTo(User, { foreignKey: "userId" });

Product.hasMany(Rating, { foreignKey: "productId", onDelete: "CASCADE" });
Rating.belongsTo(Product, { foreignKey: "productId" });

User.hasMany(Address, { foreignKey: "userId", onDelete: "CASCADE" });
Address.belongsTo(User, { foreignKey: "userId" });

Address.hasMany(Order, { foreignKey: "addressId" });
Order.belongsTo(Address, { foreignKey: "addressId" });
// ... (fin de las asociaciones existentes)

// --- 3. AÑADIR LA ASOCIACIÓN INVERSA (Buena práctica) ---
// ProductImage pertenece a un Producto
ProductImage.belongsTo(Product, { foreignKey: "productId" });
// (La asociación Product.hasMany(ProductImage) se define en productModel.js
// y se ejecuta con el bucle 'Object.values' de arriba)

module.exports = {
  sequelize,
  User,
  Product,
  Order,
  OrderItem,
  CartItem,
  Comment,
  Rating,
  Address,
  ProductImage,
};
