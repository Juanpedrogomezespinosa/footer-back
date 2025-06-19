const express = require("express");
const router = express.Router();
const {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
} = require("../services/emailService");

router.post("/welcome", async (req, res) => {
  try {
    const { email, name } = req.body;
    await sendWelcomeEmail(email, name);
    res.json({ message: "Email de bienvenida enviado" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error enviando email", error: error.message });
  }
});

router.post("/order-confirmation", async (req, res) => {
  try {
    const { email, name, items, total } = req.body;
    await sendOrderConfirmationEmail(email, name, items, total);
    res.json({ message: "Email de confirmación de pedido enviado" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error enviando email", error: error.message });
  }
});

module.exports = router;
