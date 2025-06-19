const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "No autenticado. Token requerido." });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        message: `Acceso denegado: se requiere rol de ${requiredRole}`,
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
