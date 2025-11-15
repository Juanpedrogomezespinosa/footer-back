// src/services/emailService.js

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
 * @param {string} [replyTo] - (Opcional) Dirección de respuesta
 */
async function sendEmail(to, subject, html, replyTo = null) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error("❌ No se puede enviar el correo: faltan credenciales.");
    // No lanzamos un error aquí para no romper la app, pero sí en las funciones que lo usan
    return;
  }

  try {
    const mailOptions = {
      from: `"Footer 👟" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    // Añadir replyTo si se proporciona
    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 Correo enviado a ${to} | ID: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error.message || error);
    // Relanzamos el error para que el controlador lo capture
    throw new Error("Error al enviar el correo.");
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
  await sendEmail(to, "¡Bienvenido a Footer! 👟", html);
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
  await sendEmail(to, "Confirmación de tu Pedido - Footer 👟", html);
}

// --- NUEVAS FUNCIONES DE CONTACTO ---

/**
 * Envía la consulta del formulario de contacto al email de soporte de la empresa.
 * @param {object} contactData - Datos del formulario
 * @param {string} contactData.name - Nombre del remitente
 * @param {string} contactData.fromEmail - Email del remitente
 * @param {string} contactData.subject - Asunto del mensaje
 * @param {string} contactData.message - Mensaje del remitente
 */
async function sendContactInquiry({ name, fromEmail, subject, message }) {
  // El email de destino es tu propio email de soporte (el mismo que EMAIL_USER o uno nuevo)
  const to = EMAIL_USER;

  const subjectToAdmin = `Nueva consulta de ${name}: ${subject}`;

  // No usamos plantilla Handlebars aquí, es un email directo.
  const html = `
    <p>Has recibido una nueva consulta de contacto:</p>
    <ul>
      <li><strong>Nombre:</strong> ${name}</li>
      <li><strong>Email:</strong> ${fromEmail}</li>
      <li><strong>Asunto:</strong> ${subject}</li>
    </ul>
    <hr>
    <p><strong>Mensaje:</strong></p>
    <p>${message.replace(/\n/g, "<br>")}</p>
  `;

  console.log(`🛠 Enviando consulta de contacto a ${to}`);
  // Usamos 'fromEmail' como 'replyTo'
  await sendEmail(to, subjectToAdmin, html, fromEmail);
}

/**
 * Envía un correo de confirmación automático al usuario que llenó el formulario.
 * @param {string} toEmail - Dirección de correo del destinatario (el usuario)
 * @param {string} name - Nombre del usuario
 */
async function sendContactConfirmation({ toEmail, name }) {
  // Usamos una nueva plantilla: 'contact-confirmation.html'
  const html = loadTemplate("contact-confirmation.html", { name });
  console.log(`🛠 Enviando confirmación de contacto a ${toEmail}`);
  await sendEmail(toEmail, "Hemos recibido tu consulta - Footer 👟", html);
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendContactInquiry, // <-- Nueva exportación
  sendContactConfirmation, // <-- Nueva exportación
};
