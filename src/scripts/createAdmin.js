const bcrypt = require("bcrypt");
const sequelize = require("../config/db");
const User = require("../models/userModel");

const createAdmin = async () => {
  const username = "admFooter";
  const email = "admFooter@gmail.com";
  const password = "Footer.admin32";
  const role = "admin";

  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log("Ya existe un usuario con ese email.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
    });

    console.log("✅ Administrador creado correctamente:", admin.email);
  } catch (error) {
    console.error("❌ Error al crear el administrador:", error);
  } finally {
    await sequelize.close();
  }
};

createAdmin();
