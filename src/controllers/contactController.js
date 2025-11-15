// src/controllers/contactController.js

const emailService = require("../services/emailService");

exports.handleContactForm = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // 1. Validación de entrada
    if (!name || !email || !subject || !message) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios" });
    }

    // 2. Enviar el email a la empresa (con los datos del usuario)
    await emailService.sendContactInquiry({
      name,
      fromEmail: email,
      subject,
      message,
    });

    // 3. Enviar el email de confirmación al usuario
    await emailService.sendContactConfirmation({
      toEmail: email,
      name,
    });

    // 4. Responder al frontend con éxito
    res.status(200).json({
      message: "Mensaje enviado con éxito. Gracias por contactarnos.",
    });
  } catch (error) {
    // Tu errorHandler.js global capturará esto
    next(error);
  }
};
