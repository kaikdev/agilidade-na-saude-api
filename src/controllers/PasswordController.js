const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserService = require("../services/UserService");
const MailService = require("../services/MailService");
const logEvent = require("../services/LogService");
const UserRepository = require("../repository/UserRepository");
require("dotenv").config();

const PasswordController = {

  // Alterar senha (usuário autenticado)
  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Obtém o usuário
      const user = await UserService.getUserById(userId);

      if (!user) {
        logEvent(`Usuário não encontrado: ${userId}`);
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      // Verifica a senha antiga
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        logEvent(`Tentativa falha de troca de senha - Usuário ID: ${userId}`);
        return res.status(400).json({ error: "Senha antiga incorreta." });
      }

      // Gera o novo hash
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualiza a senha
      await UserService.updatePassword(userId, hashedPassword);

      logEvent(`Senha alterada com sucesso - Usuário ID: ${userId}`);
      res.json({ message: "Senha alterada com sucesso!" });

    } catch (error) {
      console.error("Erro ao trocar a senha:", error);
      res.status(500).json({ error: "Erro ao atualizar senha." });
    }
  },

  // Enviar e-mail de recuperação
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      console.log(`Solicitação de recuperação de senha para o e-mail: ${email}`);

      const user = await UserService.getUserByEmail(email);

      if (!user) {
        logEvent(`E-mail não encontrado: ${email}`);
        return res.status(404).json({ error: "E-mail não encontrado." });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      const sendReset = await MailService.sendResetPasswordEmail(email, token);

      if (!sendReset) {
        logEvent(`Erro ao enviar e-mail para: ${email}`);
        return res.status(500).json({ error: "Erro ao enviar e-mail." });
      }

      res.json({ message: "E-mail de recuperação enviado com sucesso!" });
    } catch (error) {
      console.error("Erro ao processar solicitação de recuperação:", error);
      return res.status(500).json({ error: "Erro interno no servidor." });
    }
  },

  // Resetar senha com token
  resetPassword: async (req, res) => {
    try {
      const { resetToken } = req.params; // Pega o token da URL
      const { newPassword } = req.body;  // Pega a nova senha do corpo

      if (!resetToken || !newPassword) {
        return res.status(400).json({ error: "Token e nova senha são obrigatórios." });
      }

      // Validação
      if (!UserRepository.validatePassword(newPassword)) {
        return res.status(400).json({
          error: "Senha fraca. A nova senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial."
        });
      }

      let decoded;

      try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      } 
      catch (error) {
        logEvent(`Token inválido ou expirado ao tentar redefinir senha. Token: ${resetToken}`);
        
        return res.status(400).json({ error: "Token inválido ou expirado. Solicite um novo link de redefinição." });
      }

      const userExists = await UserService.getUserById(decoded.id);
      if (!userExists) {
        logEvent(`Usuário do token de redefinição não encontrado: ${decoded.id}`);
        
        return res.status(400).json({ error: "Link de redefinição inválido ou usuário não encontrado." });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await UserService.updatePassword(decoded.id, hashedPassword);

      logEvent(`Senha redefinida com sucesso - Usuário ID: ${decoded.id}`);
      
      res.json({ message: "Senha redefinida com sucesso! Você já pode fazer login com sua nova senha." });
    } 
    catch (error) {
      console.error("Erro ao redefinir senha:", error);
      
      logEvent(`Erro no servidor ao tentar redefinir senha. Erro: ${error.message}`);
      
      res.status(500).json({ error: "Erro ao redefinir senha. Tente novamente mais tarde." });
    }
  }
};

module.exports = PasswordController;