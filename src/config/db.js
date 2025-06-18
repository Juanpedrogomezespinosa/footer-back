const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Añade esto para sincronizar y actualizar el esquema
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Base de datos sincronizada (tablas actualizadas).");
  })
  .catch((err) => {
    console.error("Error sincronizando la base de datos:", err);
  });

module.exports = sequelize;
