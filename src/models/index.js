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

User.hasMany(Order, { foreignKey: "userId", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "userId" });

Order.hasMany(OrderItem, { foreignKey: "orderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

// --- ¡¡¡ASOCIACIÓN ANTIGUA ELIMINADA!!! ---
// Ya no tiene sentido una relación directa Order <-> Product
// Order.belongsToMany(Product, {
//   through: OrderItem,
//   foreignKey: "orderId",
//   otherKey: "productId",
// });

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

// --- ¡¡¡AQUÍ ESTÁ LA MAGIA CORREGIDA!!! ---

// --- Product <-> OrderItem (¡CORREGIDO!) ---
// La relación ya no es con Product, es con ProductVariantStock
ProductVariantStock.hasMany(OrderItem, {
  foreignKey: "productVariantStockId",
});
OrderItem.belongsTo(ProductVariantStock, {
  foreignKey: "productVariantStockId",
});

// --- Product <-> CartItem (¡CORREGIDO!) ---
// La relación ya no es con Product, es con ProductVariantStock
ProductVariantStock.hasMany(CartItem, {
  foreignKey: "productVariantStockId",
});
CartItem.belongsTo(ProductVariantStock, {
  foreignKey: "productVariantStockId",
  // Puedes añadir un alias si lo necesitas en tus consultas
  // as: 'Variant'
});

// Product <-> Comment (Sigue igual, los comentarios son sobre el producto general)
Product.hasMany(Comment, { foreignKey: "productId", onDelete: "CASCADE" });
Comment.belongsTo(Product, { foreignKey: "productId" });

// Product <-> Rating (Sigue igual, las valoraciones son sobre el producto general)
Product.hasMany(Rating, { foreignKey: "productId", onDelete: "CASCADE" });
Rating.belongsTo(Product, { foreignKey: "productId" });

// Product <-> ProductImage (Sigue igual)
Product.hasMany(ProductImage, {
  foreignKey: "productId",
  as: "images", // <-- El alias que busca el controller
  onDelete: "CASCADE",
});
ProductImage.belongsTo(Product, { foreignKey: "productId" });

// Product <-> ProductVariantStock (Sigue igual, esta es la conexión clave)
Product.hasMany(ProductVariantStock, {
  foreignKey: "productId",
  as: "variants", // <-- El alias que busca el controller
});
ProductVariantStock.belongsTo(Product, {
  foreignKey: "productId",
  // Este alias es crucial para que el orderController pueda hacer:
  // include: [{ model: ProductVariantStock, include: [Product] }]
  as: "Product",
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
