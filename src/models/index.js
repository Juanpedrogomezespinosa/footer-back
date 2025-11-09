// src/models/index.js
const sequelize = require("../config/db");

// --- 1. IMPORTACIONES ---
const User = require("./userModel");
const Product = require("./productModel");
const Order = require("./orderModel");
const OrderItem = require("./orderItemModel");
const CartItem = require("./cartItemModel");
const Comment = require("./commentModel");
const Rating = require("./ratingModel");
const Address = require("./addressModel");
const ProductImage = require("./productImageModel");
const ProductVariantStock = require("./productvariantstock");

const models = {
  User,
  Product,
  Order,
  OrderItem,
  CartItem,
  Comment,
  Rating,
  Address,
  ProductImage,
  ProductVariantStock,
};

// --- 2. LOOP DE ASOCIACIÓN (Para modelos antiguos) ---
Object.values(models).forEach((model) => {
  if (typeof model.associate === "function") {
    // Esto ejecutará .associate() para User, Order, Address, etc.
    model.associate(models);
  }
});

// --- 3. ASOCIACIONES EXPLÍCITAS (Nuestra fuente de verdad) ---
// (Aquí ya tenías la mayoría)

User.hasMany(Order, { foreignKey: "userId", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "userId" });

Order.hasMany(OrderItem, { foreignKey: "orderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

Order.belongsToMany(Product, {
  through: OrderItem,
  foreignKey: "orderId",
  otherKey: "productId",
});

User.hasMany(CartItem, { foreignKey: "userId", onDelete: "CASCADE" });
CartItem.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Comment, { foreignKey: "userId", onDelete: "CASCADE" });
Comment.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Rating, { foreignKey: "userId", onDelete: "CASCADE" });
Rating.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Address, { foreignKey: "userId", onDelete: "CASCADE" });
Address.belongsTo(User, { foreignKey: "userId" });

Address.hasMany(Order, { foreignKey: "addressId" });
Order.belongsTo(Address, { foreignKey: "addressId" });

// --- ¡¡¡AQUÍ ESTÁ LA MAGIA!!! ---
// Centralizamos TODAS las asociaciones de Product aquí.

// Product <-> OrderItem
Product.hasMany(OrderItem, { foreignKey: "productId" });
OrderItem.belongsTo(Product, { foreignKey: "productId" });

// Product <-> CartItem
Product.hasMany(CartItem, { foreignKey: "productId" });
CartItem.belongsTo(Product, { foreignKey: "productId" });

// Product <-> Comment
Product.hasMany(Comment, { foreignKey: "productId", onDelete: "CASCADE" });
Comment.belongsTo(Product, { foreignKey: "productId" });

// Product <-> Rating
Product.hasMany(Rating, { foreignKey: "productId", onDelete: "CASCADE" });
Rating.belongsTo(Product, { foreignKey: "productId" });

// Product <-> ProductImage (La que arregló el admin)
Product.hasMany(ProductImage, {
  foreignKey: "productId",
  as: "images", // <-- El alias que busca el controller
  onDelete: "CASCADE",
});
ProductImage.belongsTo(Product, { foreignKey: "productId" });

// Product <-> ProductVariantStock (La que arreglará la pág. pública)
Product.hasMany(ProductVariantStock, {
  foreignKey: "productId",
  as: "variants", // <-- El alias que busca el controller
});
ProductVariantStock.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});
// ------------------------------------

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
  ProductVariantStock,
};
