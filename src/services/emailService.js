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
    return;
  }

  try {
    const mailOptions = {
      from: `"Footer 👟" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 Correo enviado a ${to} | ID: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error.message || error);
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
 * @param {object} summaryData - Objeto con {total, subtotal, tax, shippingCost}
 */
async function sendOrderConfirmationEmail(to, name, items, summaryData) {
  const html = loadTemplate("order-confirmation.html", {
    name,
    items,
    total: summaryData.total,
    subtotal: summaryData.subtotal,
    tax: summaryData.tax,
    shippingCost: summaryData.shippingCost,
  });
  console.log("🛠 Generando email de confirmación de pedido para:", name);
  await sendEmail(to, "Confirmación de tu Pedido - Footer 👟", html);
}

/**
 * Envía la consulta del formulario de contacto al email de soporte de la empresa.
 * @param {object} contactData - Datos del formulario
 */
async function sendContactInquiry({ name, fromEmail, subject, message }) {
  const to = EMAIL_USER;
  const subjectToAdmin = `Nueva consulta de ${name}: ${subject}`;
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
  await sendEmail(to, subjectToAdmin, html, fromEmail);
}

/**
 * Envía un correo de confirmación automático al usuario que llenó el formulario.
 * @param {string} toEmail - Dirección de correo del destinatario (el usuario)
 * @param {string} name - Nombre del usuario
 */
async function sendContactConfirmation({ toEmail, name }) {
  const html = loadTemplate("contact-confirmation.html", { name });
  console.log(`🛠 Enviando confirmación de contacto a ${toEmail}`);
  await sendEmail(toEmail, "Hemos recibido tu consulta - Footer 👟", html);
}

/**
 * Envía una notificación de nuevo pedido al admin de la tienda
 * @param {object} user - Objeto del usuario que compró
 * @param {object} order - Objeto del pedido (incluye .Address)
 * @param {Array} items - Lista de productos comprados
 * @param {object} summaryData - (Opcional) Objeto con {total, subtotal, tax, shippingCost}
 */
async function sendNewOrderNotification(user, order, items, summaryData = {}) {
  const to = EMAIL_USER;
  // Si summaryData viene vacío (compatibilidad), calculamos algo básico o dejamos vacío
  // Pero con la actualización de orderController, debería venir lleno.
  const html = loadTemplate("new-order-notification.html", {
    user,
    order,
    items,
    address: order.Address,
    subtotal: summaryData.subtotal || "N/A",
    tax: summaryData.tax || "N/A",
    shippingCost: summaryData.shippingCost || "0.00",
  });
  console.log(
    `🛠 Generando email de NOTIFICACIÓN DE ADMIN para pedido: ${order.id}`
  );
  await sendEmail(to, `¡Nuevo Pedido Recibido! - #${order.id}`, html);
}

/**
 * Envía un correo para restablecer la contraseña
 * @param {string} toEmail - Email del destinatario
 * @param {string} name - Nombre del usuario
 * @param {string} resetLink - Enlace para restablecer la contraseña
 */
async function sendPasswordResetEmail(toEmail, name, resetLink) {
  const html = loadTemplate("reset-password.html", { name, resetLink });
  console.log(`🛠 Generando email de reseteo de contraseña para: ${toEmail}`);
  await sendEmail(toEmail, "Restablece tu contraseña de Footer 👟", html);
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendContactInquiry,
  sendContactConfirmation,
  sendNewOrderNotification,
  sendPasswordResetEmail,
};
