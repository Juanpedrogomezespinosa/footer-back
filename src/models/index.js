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

// --- 2. LOOP DE ASOCIACIÓN  ---
Object.values(models).forEach((model) => {
  if (typeof model.associate === "function") {
    // Esto ejecutará .associate() para User, Order, Address, etc.
    model.associate(models);
  }
});

// --- 3. ASOCIACIONES EXPLÍCITAS  ---

User.hasMany(Order, { foreignKey: "userId", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "userId" });

Order.hasMany(OrderItem, { foreignKey: "orderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

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

ProductVariantStock.hasMany(OrderItem, {
  foreignKey: "productVariantStockId",
});
OrderItem.belongsTo(ProductVariantStock, {
  foreignKey: "productVariantStockId",
});

ProductVariantStock.hasMany(CartItem, {
  foreignKey: "productVariantStockId",
});
CartItem.belongsTo(ProductVariantStock, {
  foreignKey: "productVariantStockId",
});

Product.hasMany(Comment, { foreignKey: "productId", onDelete: "CASCADE" });
Comment.belongsTo(Product, { foreignKey: "productId" });

Product.hasMany(Rating, { foreignKey: "productId", onDelete: "CASCADE" });
Rating.belongsTo(Product, { foreignKey: "productId" });

Product.hasMany(ProductImage, {
  foreignKey: "productId",
  as: "images",
  onDelete: "CASCADE",
});
ProductImage.belongsTo(Product, { foreignKey: "productId" });

Product.hasMany(ProductVariantStock, {
  foreignKey: "productId",
  as: "variants",
});
ProductVariantStock.belongsTo(Product, {
  foreignKey: "productId",
  as: "Product",
});

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
