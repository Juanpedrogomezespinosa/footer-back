const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
require("dotenv").config();

const { EMAIL_USER, EMAIL_PASS } = process.env;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn(
    "⚠️ EMAIL_USER o EMAIL_PASS no están definidos en el archivo .env. El envío de correos no funcionará."
  );
}

// Configuración del transportador para Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * Carga una plantilla Handlebars desde el directorio /src/emails/
 * @param {string} templateName - Nombre del archivo de plantilla HTML
 * @param {object} data - Datos a inyectar en la plantilla
 * @returns {string} - HTML renderizado
 */
function loadTemplate(templateName, data) {
  const templatePath = path.join(__dirname, "../emails", templateName);
  const templateSource = fs.readFileSync(templatePath, "utf8");
  const template = Handlebars.compile(templateSource);
  return template(data);
}

/**
 * Envía un correo utilizando Nodemailer
 * @param {string} to - Dirección de correo del destinatario
 * @param {string} subject - Asunto del correo
 * @param {string} html - Contenido HTML del correo
 */
async function sendEmail(to, subject, html) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error("❌ No se puede enviar el correo: faltan credenciales.");
    return;
  }

  try {
    const mailOptions = {
      from: `"Footer 👟" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 Correo enviado a ${to} | ID: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error.message || error);
    throw error;
  }
}

/**
 * Envía un correo de bienvenida a un nuevo usuario
 * @param {string} to - Dirección de correo del destinatario
 * @param {string} name - Nombre del usuario
 */
async function sendWelcomeEmail(to, name) {
  const html = loadTemplate("welcome.html", { name });
  console.log("🛠 Generando email de bienvenida para:", name);
  await sendEmail(to, "Bienvenido a Footer 👟", html);
}

/**
 * Envía un correo de confirmación de pedido
 * @param {string} to - Dirección de correo del destinatario
 * @param {string} name - Nombre del usuario
 * @param {Array} items - Lista de productos comprados
 * @param {number} total - Total de la compra
 */
async function sendOrderConfirmationEmail(to, name, items, total) {
  const html = loadTemplate("order-confirmation.html", { name, items, total });
  console.log("🛠 Generando email de confirmación de pedido para:", name);
  await sendEmail(to, "Pedido Confirmado - Footer 👟", html);
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
};
