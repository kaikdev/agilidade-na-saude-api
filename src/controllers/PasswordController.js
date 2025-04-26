const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserService = require("../services/UserService");
const MailService = require("../services/MailService");
const logEvent = require("../services/LogService");
require("dotenv").config();

const PasswordController = {
  // Alterar senha (usuário autenticado)
  changePassword: (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    UserService.getUserById(userId, async (err, user) => {
      if (err || !user) {
        logEvent(`Usuário não encontrado: ${userId}`);
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        logEvent(`Tentativa falha de troca de senha - Usuário ID: ${userId}`);
        return res.status(400).json({ error: "Senha antiga incorreta." });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      UserService.updatePassword(userId, hashedPassword, (err) => {
        if (err) {
          return res.status(500).json({ error: "Erro ao atualizar senha." });
        }
        logEvent(`Senha alterada com sucesso - Usuário ID: ${userId}`);
        res.json({ message: "Senha alterada com sucesso!" });
      });
    });
  },

  // Enviar e-mail de recuperação
  forgotPassword: (req, res) => {
    const { email } = req.body;

    UserService.getUserByEmail(email, (err, user) => {
      if (err || !user) {
        logEvent(`E-mail não encontrado: ${email}`);
        return res.status(404).json({ error: "E-mail não encontrado." });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      MailService.sendResetPasswordEmail(email, token, (error) => {
        if (error){
          logEvent(`Erro ao enviar e-mail.`);
          return res.status(500).json({ error: "Erro ao enviar e-mail." });
        }
        res.json({ message: "E-mail de recuperação enviado!" });
      });
    });
  },

  // Resetar senha com token
  resetPassword: (req, res) => {
    const { token, newPassword } = req.body;

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err){
        logEvent(`Token inválido ou expirado.`);
        return res.status(400).json({ error: "Token inválido ou expirado." });
      }
        
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      UserService.updatePassword(decoded.id, hashedPassword, (err) => {
        if (err){
          logEvent(`Erro ao redefinir senha.`);
          return res.status(500).json({ error: "Erro ao redefinir senha." });
        }
        res.json({ message: "Senha redefinida com sucesso!" });
      });
    });
  },
};

module.exports = PasswordController;
