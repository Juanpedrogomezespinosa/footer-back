const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido" });
    }

    // Aseguramos que el campo se llame 'id' para coherencia con el resto del código
    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  });
};

module.exports = authenticateToken;
