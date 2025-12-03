const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

// Cargamos las variables de entorno
require("dotenv").config();

// 1. CONFIGURACIÓN DE CREDENCIALES
// Usamos trim() para evitar errores por espacios accidentales al copiar de la web
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp-relay.brevo.com";
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_USER = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : "";
const EMAIL_PASS = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : "";

// Este es el correo que verán tus clientes y donde recibirás las notificaciones de admin
const PUBLIC_SENDER_EMAIL = "info.Footer@gmail.com";

// Validación básica de credenciales
if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn(
    "⚠️ ADVERTENCIA: Faltan credenciales (EMAIL_USER o EMAIL_PASS) en las variables de entorno."
  );
}

// 2. CONFIGURACIÓN DEL TRANSPORTADOR (BREVO / SMTP)
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false, // Brevo usa el puerto 587 con STARTTLS, por lo que secure debe ser false
  auth: {
    user: EMAIL_USER, // Tu usuario de login de Brevo (el código raro)
    pass: EMAIL_PASS, // Tu clave API/SMTP de Brevo
  },
  tls: {
    rejectUnauthorized: false, // Ayuda a evitar errores de certificados en servidores como Render
  },
  // Tiempos de espera para evitar cortes de conexión en la nube
  connectionTimeout: 10000,
  greetingTimeout: 5000,
});

// 3. FUNCIÓN PARA CARGAR PLANTILLAS HTML
function loadTemplate(templateName, data) {
  try {
    // Asume estructura: /services/emailService.js y /emails/archivo.html
    const templatePath = path.join(__dirname, "../emails", templateName);

    const templateSource = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateSource);
    return template(data);
  } catch (error) {
    console.error(
      `❌ Error cargando la plantilla de correo "${templateName}":`,
      error.message
    );
    // HTML de respaldo simple
    return `
      <div style="font-family: sans-serif; color: #333;">
        <h1>Hola ${data.name || "Usuario"}</h1>
        <p>No se pudo cargar el diseño del correo, pero aquí tienes la información importante.</p>
      </div>
    `;
  }
}

// 4. FUNCIÓN GENÉRICA DE ENVÍO
async function sendEmail(to, subject, html, replyTo = null) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error(
      "❌ Intento de envío cancelado: Faltan credenciales de correo."
    );
    return;
  }

  try {
    const mailOptions = {
      // "Footer 👟" será el nombre visible, y usará tu Gmail público como remitente
      from: `"Footer 👟" <${PUBLIC_SENDER_EMAIL}>`,
      to: to,
      subject: subject,
      html: html,
    };

    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `📨 Correo enviado exitosamente a: ${to} | ID: ${info.messageId}`
    );
    return info;
  } catch (error) {
    console.error(`❌ ERROR al enviar correo a ${to}:`);
    console.error(`   Motivo: ${error.message}`);
  }
}

// 5. FUNCIONES ESPECÍFICAS DE CASO DE USO

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
  // Las consultas de contacto van a TU correo público (Admin)
  const to = PUBLIC_SENDER_EMAIL;
  const subjectToAdmin = `Nueva consulta de ${name}: ${subject}`;

  const html = `
    <div style="font-family: sans-serif;">
      <h3>Has recibido una nueva consulta desde la web:</h3>
      <ul>
        <li><strong>Nombre:</strong> ${name}</li>
        <li><strong>Email del cliente:</strong> ${fromEmail}</li>
        <li><strong>Asunto:</strong> ${subject}</li>
      </ul>
      <hr>
      <p><strong>Mensaje:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    </div>
  `;

  // El replyTo es el cliente, para que al responder le escribas a él directamente
  await sendEmail(to, subjectToAdmin, html, fromEmail);
}

async function sendContactConfirmation({ toEmail, name }) {
  const html = loadTemplate("contact-confirmation.html", { name });
  await sendEmail(toEmail, "Hemos recibido tu consulta - Footer 👟", html);
}

async function sendNewOrderNotification(user, order, items, summaryData = {}) {
  // Notificación para el ADMINISTRADOR (tu correo público)
  const to = PUBLIC_SENDER_EMAIL;

  const html = loadTemplate("new-order-notification.html", {
    user,
    order,
    items,
    address: order.Address || {}, // Evita error si Address es null
    subtotal: summaryData.subtotal || "N/A",
    tax: summaryData.tax || "N/A",
    shippingCost: summaryData.shippingCost || "0.00",
  });

  await sendEmail(to, `¡Nuevo Pedido Recibido! - #${order.id}`, html);
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
