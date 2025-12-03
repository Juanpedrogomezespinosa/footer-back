const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

require("dotenv").config();

// 1. CONFIGURACIÓN DE CREDENCIALES
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp-relay.brevo.com";
// Si en Render pusiste 465, esto lo leerá. Si no, usa 465 por defecto.
const EMAIL_PORT = process.env.EMAIL_PORT
  ? parseInt(process.env.EMAIL_PORT)
  : 465;
const EMAIL_USER = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : "";
const EMAIL_PASS = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : "";

const PUBLIC_SENDER_EMAIL = "info.Footer@gmail.com";

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn("⚠️ ADVERTENCIA: Faltan credenciales de correo.");
}

// 2. CONFIGURACIÓN DEL TRANSPORTADOR (SSL FORZADO / PUERTO 465)
// Esta configuración es más robusta para evitar Timeouts en Render
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // TRUE si es 465, FALSE si es 587
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    // No fallar si el certificado no es perfecto (común en redes internas)
    rejectUnauthorized: false,
  },
  // Tiempos de espera extendidos
  connectionTimeout: 20000, // 20 segundos
  greetingTimeout: 20000,
  socketTimeout: 20000,
  debug: true, // Seguimos necesitando ver los logs si falla
  logger: true,
});

// --- VERIFICACIÓN DE CONEXIÓN AL ARRANCAR ---
// Esto intentará conectar con Brevo nada más iniciar el servidor
transporter.verify(function (error, success) {
  if (error) {
    console.error(
      "❌ ERROR CRÍTICO: No se pudo conectar al servidor de correos (Brevo):"
    );
    console.error(error);
  } else {
    console.log(
      "✅ CONEXIÓN SMTP EXITOSA: El servidor está listo para enviar correos."
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
    return `<p>Hola ${data.name}, aquí tienes información de Footer.</p>`;
  }
}

// 4. ENVÍO DE CORREO
async function sendEmail(to, subject, html, replyTo = null) {
  if (!EMAIL_USER || !EMAIL_PASS) return;

  try {
    const mailOptions = {
      from: `"Footer 👟" <${PUBLIC_SENDER_EMAIL}>`,
      to: to,
      subject: subject,
      html: html,
    };

    if (replyTo) mailOptions.replyTo = replyTo;

    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 Correo enviado a: ${to} | ID: ${info.messageId}`);
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
  const html = `<p>Mensaje de ${name} (${fromEmail}): <br> ${message}</p>`;
  await sendEmail(
    PUBLIC_SENDER_EMAIL,
    `Nueva consulta: ${subject}`,
    html,
    fromEmail
  );
}

async function sendContactConfirmation({ toEmail, name }) {
  const html = loadTemplate("contact-confirmation.html", { name });
  await sendEmail(toEmail, "Hemos recibido tu consulta - Footer 👟", html);
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
