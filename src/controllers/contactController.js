const emailService = require("../services/emailService");

exports.handleContactForm = (req, res, next) => {
  // Nota: Quitamos 'async' porque no vamos a usar 'await' para bloquear la respuesta
  try {
    const { name, email, subject, message } = req.body;

    // 1. Validación de entrada
    if (!name || !email || !subject || !message) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios" });
    }

    // 2. Iniciamos el envío de emails en segundo plano (Fire and Forget)
    // No usamos 'await' para que el usuario reciba la respuesta "OK" inmediatamente.
    emailService
      .sendContactInquiry({
        name,
        fromEmail: email,
        subject,
        message,
      })
      .catch((err) =>
        console.error("Error enviando consulta contacto:", err.message)
      );

    emailService
      .sendContactConfirmation({
        toEmail: email,
        name,
      })
      .catch((err) =>
        console.error("Error enviando confirmación contacto:", err.message)
      );

    // 3. Responder al frontend con éxito INMEDIATAMENTE
    res.status(200).json({
      message: "Mensaje enviado con éxito. Gracias por contactarnos.",
    });
  } catch (error) {
    next(error);
  }
};
