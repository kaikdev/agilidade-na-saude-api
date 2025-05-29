const bcrypt = require("bcryptjs");
const UserService = require("../services/UserService");
const Auth = require("../config/auth");
const logEvent = require("../services/LogService");

const AuthController = {
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      logEvent(`Falha no login - e-mail e senha não informados.`);
      return res
        .status(400)
        .json({ error: "E-mail e senha são obrigatórios." });
    }

    try {
      const user = await UserService.getUserByEmail(email);
      if (!user) {
        logEvent(`Falha no login - Email: ${email}`);
        return res.status(401).json({ error: "Credenciais inválidas." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        logEvent(`Falha no login - Senha incorreta para o email: ${email}`);
        return res.status(401).json({ error: "Credenciais inválidas." });
      }

      const token = Auth.generateToken(user);
      logEvent(`Login bem-sucedido - Usuário: ${email}`);
      res.json({ message: "Login realizado com sucesso.", token });
    } catch (err) {
      logEvent(`Erro durante o login - ${err.message}`);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },
};

module.exports = AuthController;