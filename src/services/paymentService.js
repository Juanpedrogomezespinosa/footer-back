const Stripe = require("stripe");
const { stripeSecretKey } = require("../config/env");

const stripe = new Stripe(stripeSecretKey);

/**
 * Crea una sesión de pago en Stripe para el checkout.
 * @param {Array} lineItems - Array de objetos con la información de los productos (precio, cantidad).
 * @param {String} successUrl - URL a donde redirigir si el pago fue exitoso.
 * @param {String} cancelUrl - URL a donde redirigir si el pago fue cancelado.
 * @returns {Promise<Object>} Sesión creada por Stripe.
 */
exports.createCheckoutSession = async (lineItems, successUrl, cancelUrl) => {
  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
    throw new Error("No se recibieron productos para crear la sesión de pago.");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session;
  } catch (error) {
    throw new Error(`Error creando sesión de pago: ${error.message}`);
  }
};

/**
 * Método legacy para simular procesamiento de pago.
 */
exports.processPayment = async (order) => {
  if (!order || !order.total) {
    throw new Error("Orden inválida para procesar el pago.");
  }

  console.log(
    `💰 Procesando pago de €${order.total} para la orden ${order.id}`
  );

  return {
    success: true,
    transactionId: `TX-${Date.now()}`,
  };
};
