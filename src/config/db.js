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

// --- BLOQUE DE SINCRONIZACIÓN DESACTIVADO ---
// Esto evita el error ER_TOO_MANY_KEYS al inicio, permitiendo que Express se cargue.
/*
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Base de datos sincronizada (tablas actualizadas).");
  })
  .catch((err) => {
    console.error("Error sincronizando la base de datos:", err);
  });
*/
// --- FIN DEL BLOQUE DE SINCRONIZACIÓN ---

module.exports = sequelize;
