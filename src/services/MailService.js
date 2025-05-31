const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  }
});

transporter.verify().then(() => {
  console.log("MailService: Conexão com o servidor SMTP do Gmail estabelecida com sucesso.");
}).catch(error => {
  console.error("MailService: Falha ao conectar com o servidor SMTP do Gmail.", error);
});

const MailService = {
  sendResetPasswordEmail: async (email, token) => {
    try {
      const resetLink = `http://localhost:5173/?resetToken=${token}`; 

      const mailSubject = "Solicitação de Redefinição de Senha – Agilidade na Saúde";

      const mailHtml = `
                <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 16px; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                        <h2 style="color: #0056b3; text-align: center;">Redefinição de Senha</h2>
                        <p>Prezado(a) Usuário(a),</p>
                        <p>Recebemos uma solicitação para redefinir a senha da sua conta em <strong>Agilidade na Saúde</strong>, associada ao e-mail ${email}.</p>
                        <p>Para criar uma nova senha, por favor, clique no botão abaixo. Este link de redefinição é válido por <strong>15 minutos</strong>.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" target="_blank" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                Redefinir Minha Senha
                            </a>
                        </div>
                        <p>Se o botão acima não funcionar, você também pode copiar e colar o seguinte link no seu navegador:</p>
                        <p style="word-break: break-all;"><a href="${resetLink}" target="_blank">${resetLink}</a></p>
                        <p>Se você não fez esta solicitação, nenhuma ação é necessária e sua senha atual permanecerá inalterada. Por favor, ignore este e-mail.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="font-size: 14px; color: #777;">Atenciosamente,</p>
                        <p style="font-size: 14px; color: #777;"><strong>A Equipe Agilidade na Saúde</strong></p>
                    </div>
                </div>
            `;

      const mailOptions = {
        from: `"Agilidade na Saúde" <${process.env.MAIL_USER}>`,
        to: email,
        subject: mailSubject,
        html: mailHtml
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("E-mail de redefinição enviado com sucesso:", info.response);
      return true;
    } catch (error) {
      console.error("Erro detalhado ao enviar e-mail de redefinição:", error);
      return false;
    }
  },
};

module.exports = MailService;