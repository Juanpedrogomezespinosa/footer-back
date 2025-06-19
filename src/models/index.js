const sequelize = require("../config/db");

const User = require("./userModel");
const Product = require("./productModel");
const Order = require("./orderModel");
const OrderItem = require("./orderItemModel");
const CartItem = require("./cartItemModel");

// Si algún modelo define un método .associate, se ejecuta para establecer relaciones
const models = {
  User,
  Product,
  Order,
  OrderItem,
  CartItem,
};

// Asociaciones por modelo (si existen)
Object.values(models).forEach((model) => {
  if (typeof model.associate === "function") {
    model.associate(models);
  }
});

/**
 * Asociaciones explícitas entre modelos
 */

// Usuario - Orden
User.hasMany(Order, { foreignKey: "userId", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "userId" });

// Orden - Items de Orden
Order.hasMany(OrderItem, { foreignKey: "orderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

// Producto - Items de Orden
Product.hasMany(OrderItem, { foreignKey: "productId" });
OrderItem.belongsTo(Product, { foreignKey: "productId" });

// Relaciones Many-to-Many entre Orden y Producto mediante OrderItem
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

// Usuario - Items del carrito
User.hasMany(CartItem, { foreignKey: "userId", onDelete: "CASCADE" });
CartItem.belongsTo(User, { foreignKey: "userId" });

// Producto - Items del carrito
Product.hasMany(CartItem, { foreignKey: "productId" });
CartItem.belongsTo(Product, { foreignKey: "productId" });

module.exports = {
  sequelize,
  User,
  Product,
  Order,
  OrderItem,
  CartItem,
};
