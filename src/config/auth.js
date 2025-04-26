require("dotenv").config();
const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET || "chave-secreta";

const Auth = {
  generateToken: (user) => {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secretKey,
      { expiresIn: "1h" }
    );
  },

  verifyToken: (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: `Token não fornecido. Recebido: ${req.headers.authorization}` });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Token inválido ou expirado." });
      }
      req.user = decoded;
      next();
    });
  },
};

module.exports = Auth;
