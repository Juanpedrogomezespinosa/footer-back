const bcrypt = require("bcrypt");

const password = "MiContraseñaAdmin123";

bcrypt
  .hash(password, 10)
  .then((hash) => {
    console.log("Hash generado:", hash);
  })
  .catch((err) => {
    console.error("Error:", err);
  });
