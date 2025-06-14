const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

  if (!token) return res.status(401).json({ message: "Token requerido" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token inválido" });

    // El payload tiene userId porque en authController usas userId
    req.user = {
      userId: decoded.userId, // Aquí coincide con payload del token
      role: decoded.role,
    };

    next();
  });
};

module.exports = authenticateToken;
