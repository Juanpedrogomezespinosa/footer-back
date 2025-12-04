const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

require("dotenv").config();

// 1. CONFIGURACIÓN DE CREDENCIALES
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp-relay.brevo.com";

// Usamos el puerto que definas en Render.
// RECOMENDACIÓN PARA RENDER: Usar puerto 2525 si el 587 da timeout.
const EMAIL_PORT = process.env.EMAIL_PORT
  ? parseInt(process.env.EMAIL_PORT)
  : 587;

const EMAIL_USER = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : "";
const EMAIL_PASS = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : "";
const PUBLIC_SENDER_EMAIL = "info.footer@gmail.com";

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn("⚠️ ADVERTENCIA: Faltan credenciales de correo.");
}

// 2. CONFIGURACIÓN DEL TRANSPORTADOR
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false, // Tanto el puerto 587 como el 2525 usan STARTTLS (secure: false)
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: "SSLv3",
  },
  // --- CONFIGURACIÓN DE RED CRÍTICA PARA RENDER ---
  family: 4, // <--- ¡IMPORTANTE! Fuerza IPv4. Node 18+ falla con IPv6 en Render a veces.
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  debug: true,
  logger: true,
});

// --- VERIFICACIÓN DE CONEXIÓN ---
transporter.verify(function (error, success) {
  if (error) {
    console.error(`❌ ERROR CRÍTICO SMTP (Puerto ${EMAIL_PORT}):`);
    console.error(error);
  } else {
    console.log(
      `✅ CONEXIÓN SMTP EXITOSA (Puerto ${EMAIL_PORT}). Listo para enviar.`
    );
  }
});

// 3. CARGA DE PLANTILLAS
function loadTemplate(templateName, data) {
  try {
    const templatePath = path.join(__dirname, "../emails", templateName);
    const templateSource = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateSource);
    return template(data);
  } catch (error) {
    console.error(
      `❌ Error cargando plantilla "${templateName}":`,
      error.message
    );
    return `
      <div style="font-family: sans-serif;">
        <h1>Hola ${data.name || "Usuario"}</h1>
        <p>Mensaje de Footer.</p>
      </div>
    `;
  }
}

// 4. FUNCIÓN DE ENVÍO
async function sendEmail(to, subject, html, replyTo = null) {
  if (!EMAIL_USER || !EMAIL_PASS) return;

  try {
    const mailOptions = {
      from: `"Footer 👟" <${PUBLIC_SENDER_EMAIL}>`,
      to: to,
      subject: subject,
      html: html,
      replyTo: replyTo || PUBLIC_SENDER_EMAIL,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 Enviado a: ${to} | ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ ERROR al enviar correo a ${to}:`);
    console.error(`   Motivo: ${error.message}`);
  }
}

// 5. EXPORTACIONES
async function sendWelcomeEmail(to, name) {
  const html = loadTemplate("welcome.html", { name });
  await sendEmail(to, "¡Bienvenido a Footer! 👟", html);
}

async function sendOrderConfirmationEmail(to, name, items, summaryData) {
  const html = loadTemplate("order-confirmation.html", {
    name,
    items,
    total: summaryData.total,
    subtotal: summaryData.subtotal,
    tax: summaryData.tax,
    shippingCost: summaryData.shippingCost,
  });
  await sendEmail(to, "Confirmación de tu Pedido - Footer 👟", html);
}

async function sendContactInquiry({ name, fromEmail, subject, message }) {
  const html = `<p><strong>De:</strong> ${name} (${fromEmail})</p><p>${message}</p>`;
  await sendEmail(PUBLIC_SENDER_EMAIL, `Consulta: ${subject}`, html, fromEmail);
}

async function sendContactConfirmation({ toEmail, name }) {
  const html = loadTemplate("contact-confirmation.html", { name });
  await sendEmail(toEmail, "Recibimos tu consulta - Footer 👟", html);
}

async function sendNewOrderNotification(user, order, items, summaryData = {}) {
  const html = loadTemplate("new-order-notification.html", {
    user,
    order,
    items,
    address: order.Address || {},
    subtotal: summaryData.subtotal,
    tax: summaryData.tax,
    shippingCost: summaryData.shippingCost,
  });
  await sendEmail(PUBLIC_SENDER_EMAIL, `¡Nuevo Pedido! - #${order.id}`, html);
}

async function sendPasswordResetEmail(toEmail, name, resetLink) {
  const html = loadTemplate("reset-password.html", { name, resetLink });
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
