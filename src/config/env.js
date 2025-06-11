require("dotenv").config();

const config = {
  port: process.env.PORT || 3000,
  db: {
    name: process.env.DB_NAME || "Footer",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    host: process.env.DB_HOST || "127.0.0.1",
  },
  jwtSecret: process.env.JWT_SECRET || "dfgdfge",
};

module.exports = config;
