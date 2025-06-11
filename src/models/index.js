const sequelize = require("../config/db");
const User = require("./userModel");
const Product = require("./productModel");
const Order = require("./orderModel");
const OrderItem = require("./orderItemModel");

User.hasMany(Order, { foreignKey: "user_id", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "user_id" });

Order.belongsToMany(Product, {
  through: OrderItem,
  foreignKey: "order_id",
  otherKey: "product_id",
});
Product.belongsToMany(Order, {
  through: OrderItem,
  foreignKey: "product_id",
  otherKey: "order_id",
});

OrderItem.belongsTo(Order, { foreignKey: "order_id" });
OrderItem.belongsTo(Product, { foreignKey: "product_id" });
Order.hasMany(OrderItem, { foreignKey: "order_id" });
Product.hasMany(OrderItem, { foreignKey: "product_id" });

module.exports = {
  sequelize,
  User,
  Product,
  Order,
  OrderItem,
};
