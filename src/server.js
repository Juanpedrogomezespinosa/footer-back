const app = require("./app");
const { sequelize } = require("./models");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // Probar conexión con Sequelize
    await sequelize.authenticate();
    console.log(
      "✅ Conexión a la base de datos con Sequelize establecida correctamente."
    );

    // Sincronizar tablas sin borrar datos
    await sequelize.sync();
    console.log("✅ Tablas sincronizadas (sin borrado).");

    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      "❌ Error al conectar a la base de datos o iniciar servidor:",
      error
    );
  }
})();
