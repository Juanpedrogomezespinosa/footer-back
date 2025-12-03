const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

// Cargamos las variables de entorno
// Si tu archivo .env está en la raíz y este archivo está en una subcarpeta, esto suele funcionar si ejecutas desde la raíz.
require("dotenv").config();

// 1. OBTENCIÓN Y LIMPIEZA DE CREDENCIALES
const emailUserRaw = process.env.EMAIL_USER;
const emailPassRaw = process.env.EMAIL_PASS;

// Eliminamos posibles espacios en blanco de la contraseña (común al copiar de Google)
const EMAIL_USER = emailUserRaw ? emailUserRaw.trim() : "";
const EMAIL_PASS = emailPassRaw ? emailPassRaw.replace(/\s+/g, "") : "";

// --- DIAGNÓSTICO DE ARRANQUE (Puedes borrar esto cuando funcione) ---
console.log("--- DEBUG EMAIL SERVICE ---");
console.log(
  "EMAIL_USER detectado:",
  EMAIL_USER ? EMAIL_USER : "❌ NO DEFINIDO"
);
console.log(
  "EMAIL_PASS detectado:",
  EMAIL_PASS ? "✅ SÍ (Longitud: " + EMAIL_PASS.length + ")" : "❌ NO DEFINIDO"
);
console.log("---------------------------");
// -------------------------------------------------------------------

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn(
    "⚠️ ADVERTENCIA: EMAIL_USER o EMAIL_PASS no están definidos en el archivo .env. El envío de correos fallará."
  );
}

// 2. CONFIGURACIÓN DEL TRANSPORTADOR (GMAIL)
// Usamos configuración explícita en lugar de "service: gmail" para evitar Timeouts en Render
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true para 465, false para otros puertos (587)
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Ayuda a que no falle si Google cambia certificados
  },
});

// 3. FUNCIÓN PARA CARGAR PLANTILLAS HTML
function loadTemplate(templateName, data) {
  try {
    // Asume que la carpeta 'emails' está un nivel arriba de este archivo.
    // Estructura esperada:
    // - /services/emailService.js
    // - /emails/welcome.html
    const templatePath = path.join(__dirname, "../emails", templateName);

    const templateSource = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateSource);
    return template(data);
  } catch (error) {
    console.error(
      `❌ Error cargando la plantilla de correo "${templateName}":`,
      error.message
    );
    // Retornamos un HTML básico de respaldo para no romper el envío
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
      from: `"Footer 👟" <${EMAIL_USER}>`,
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
    console.error(`❌ ERROR CRÍTICO al enviar correo a ${to}:`);
    console.error(`   Motivo: ${error.message}`);
    // No lanzamos throw para no detener la ejecución del servidor, pero registramos el error.
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
  // Este correo se envía AL ADMIN (EMAIL_USER)
  const to = EMAIL_USER;
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

  // Pasamos fromEmail como replyTo para que al dar "Responder" le contestes al cliente
  await sendEmail(to, subjectToAdmin, html, fromEmail);
}

async function sendContactConfirmation({ toEmail, name }) {
  const html = loadTemplate("contact-confirmation.html", { name });
  await sendEmail(toEmail, "Hemos recibido tu consulta - Footer 👟", html);
}

async function sendNewOrderNotification(user, order, items, summaryData = {}) {
  // Notificación para el ADMINISTRADOR
  const to = EMAIL_USER;

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
