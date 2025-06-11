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
