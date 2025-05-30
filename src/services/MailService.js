const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

transporter.verify().then(console.log).catch(console.error);

const MailService = {
  sendResetPasswordEmail: async (email, token) => {
    try {
      const resetLink = `http://localhost:3000/api/reset-password/${token}`;
      const mailOptions = {
        from: process.env.MAIL_USER,
        to: email,
        subject: "Recuperação de Senha",
        text: `Clique no link para redefinir sua senha: ${resetLink}`,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("E-mail enviado:", info.response);

      return true; // Indica sucesso
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      return false; // Indica falha
    }
  },
};

module.exports = MailService;
