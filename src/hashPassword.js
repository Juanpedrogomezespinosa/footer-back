const bcrypt = require("bcrypt");

const password = "Footer.admin32";

bcrypt
  .hash(password, 10)
  .then((hash) => {
    console.log("Hash generado:", hash);
  })
  .catch((err) => {
    console.error("Error:", err);
  });
