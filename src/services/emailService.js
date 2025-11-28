const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
require("dotenv").config();

const { EMAIL_USER, EMAIL_PASS } = process.env;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn(
    "⚠️ EMAIL_USER o EMAIL_PASS no están definidos. El envío de correos no funcionará."
  );
}

// Configuración del transportador para Gmail (Puerto 465 Seguro)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Ayuda con certificados en entornos cloud
  },
});

function loadTemplate(templateName, data) {
  try {
    const templatePath = path.join(__dirname, "../emails", templateName);
    const templateSource = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateSource);
    return template(data);
  } catch (error) {
    console.error(`❌ Error cargando plantilla ${templateName}:`, error);
    return "<p>Error cargando el contenido del correo.</p>";
  }
}

async function sendEmail(to, subject, html, replyTo = null) {
  if (!EMAIL_USER || !EMAIL_PASS) return;

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
    console.error(`❌ Error al enviar correo a ${to}:`, error.message);
    // IMPORTANTE: No lanzamos 'throw' aquí para no romper el flujo principal si el correo falla
    // Solo lo logueamos.
  }
}

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
  const to = EMAIL_USER;
  const subjectToAdmin = `Nueva consulta de ${name}: ${subject}`;
  const html = `
    <h3>Has recibido una nueva consulta:</h3>
    <ul>
      <li><strong>Nombre:</strong> ${name}</li>
      <li><strong>Email:</strong> ${fromEmail}</li>
      <li><strong>Asunto:</strong> ${subject}</li>
    </ul>
    <hr>
    <p>${message.replace(/\n/g, "<br>")}</p>
  `;
  await sendEmail(to, subjectToAdmin, html, fromEmail);
}

async function sendContactConfirmation({ toEmail, name }) {
  const html = loadTemplate("contact-confirmation.html", { name });
  await sendEmail(toEmail, "Hemos recibido tu consulta - Footer 👟", html);
}

async function sendNewOrderNotification(user, order, items, summaryData = {}) {
  const to = EMAIL_USER;
  const html = loadTemplate("new-order-notification.html", {
    user,
    order,
    items,
    address: order.Address,
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
