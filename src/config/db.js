const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, // Agregamos el puerto aquí por si acaso
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true, // Obligatorio para Aiven
        rejectUnauthorized: false, // Evita errores de certificados en la capa gratuita
      },
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
