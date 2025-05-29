const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail", // Ou configure outro provedor SMTP
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const MailService = {
  sendResetPasswordEmail: (email, token, callback) => {
    const resetLink = `http://localhost:3001/reset-password/${token}`;

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: "Recuperação de Senha",
      text: `Clique no link para redefinir sua senha: ${resetLink}`,
    };

    transporter.sendMail(mailOptions, callback);
  },
};

module.exports = MailService;
