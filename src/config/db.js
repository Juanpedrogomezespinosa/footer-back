const { Sequelize } = require("sequelize");
require("dotenv").config();

// --- CHIVATO DE DEBUG (Bórralo cuando funcione) ---
console.log("-----------------------------------------");
console.log("INTENTANDO CONECTAR A LA BASE DE DATOS...");
console.log(
  "HOST:",
  process.env.DB_HOST ? process.env.DB_HOST : "¡ESTÁ VACÍO! USANDO LOCALHOST"
);
console.log(
  "PORT:",
  process.env.DB_PORT ? process.env.DB_PORT : "¡VACÍO! USANDO 3306"
);
console.log("USER:", process.env.DB_USER);
console.log("DB:", process.env.DB_NAME);
console.log("-----------------------------------------");
// ---------------------------------------------------

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
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
