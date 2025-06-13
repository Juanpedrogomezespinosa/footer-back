const { sequelize } = require("./models");

(async () => {
  try {
    await sequelize.sync({ force: true });
    console.log(
      "🗑️ Base de datos reseteada: todas las tablas eliminadas y creadas de nuevo."
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Error reseteando la base de datos:", error);
    process.exit(1);
  }
})();
