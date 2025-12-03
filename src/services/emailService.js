const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

require("dotenv").config();

// 1. CONFIGURACIÓN DE CREDENCIALES
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp-relay.brevo.com";

// Usamos el puerto 587 directamente, ya que es el estándar de Brevo que configuramos en Render
const EMAIL_PORT = 587;

// Obtenemos las credenciales limpias de espacios
const EMAIL_USER = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : "";
const EMAIL_PASS = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : "";

// Este es el remitente visible (Tu correo de Gmail verificado en Brevo)
const PUBLIC_SENDER_EMAIL = "info.footer@gmail.com";

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn(
    "⚠️ ADVERTENCIA: Faltan credenciales de correo (EMAIL_USER o EMAIL_PASS)."
  );
}

// 2. CONFIGURACIÓN DEL TRANSPORTADOR (PUERTO 587 / STARTTLS)
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false, // IMPORTANTE: Para el puerto 587, secure debe ser false (STARTTLS)
  auth: {
    user: EMAIL_USER, // Tu usuario de Brevo (9d3f...)
    pass: EMAIL_PASS, // Tu clave SMTP
  },
  tls: {
    rejectUnauthorized: false, // Ayuda a la compatibilidad en servidores cloud como Render
  },
  // Tiempos de espera para diagnósticos
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  debug: true, // Muestra logs detallados del proceso SMTP
  logger: true, // Muestra los logs en la consola de Render
});

// --- VERIFICACIÓN DE CONEXIÓN AL ARRANCAR ---
transporter.verify(function (error, success) {
  if (error) {
    console.error(
      "❌ ERROR CRÍTICO: No se pudo conectar al servidor de correos (Brevo):"
    );
    console.error(error);
  } else {
    console.log(
      "✅ CONEXIÓN SMTP EXITOSA: El servidor está listo para enviar correos (Puerto 587)."
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
    // HTML de respaldo simple
    return `
      <div style="font-family: sans-serif;">
        <h1>Hola ${data.name || "Usuario"}</h1>
        <p>No se pudo cargar el diseño del correo, pero aquí tienes la información importante.</p>
      </div>
    `;
  }
}

// 4. FUNCIÓN GENÉRICA DE ENVÍO DE CORREO
async function sendEmail(to, subject, html, replyTo = null) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error("❌ Envío cancelado: Faltan credenciales.");
    return;
  }

  try {
    const mailOptions = {
      // Usamos el PUBLIC_SENDER_EMAIL para que el cliente vea "info.footer@gmail.com"
      from: `"Footer 👟" <${PUBLIC_SENDER_EMAIL}>`,
      to: to,
      subject: subject,
      html: html,
      replyTo: replyTo || PUBLIC_SENDER_EMAIL,
    };

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

// 5. EXPORTACIONES (FUNCIONES ESPECÍFICAS)

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
  // Enviamos la notificación AL ADMIN (que es el email público)
  const html = `
    <div style="font-family: sans-serif;">
       <h3>Nueva Consulta Web</h3>
       <p><strong>De:</strong> ${name} (${fromEmail})</p>
       <p><strong>Asunto:</strong> ${subject}</p>
       <hr/>
       <p>${message.replace(/\n/g, "<br>")}</p>
    </div>
  `;
  // Usamos fromEmail como replyTo para responder directamente al cliente
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
  // Notificación para el ADMIN
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
