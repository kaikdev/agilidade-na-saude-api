const MailService = require('../services/MailService');

const ContactController = {
    sendContactEmail: async (req, res) => {
        const { nome, email, mensagem } = req.body;

        if (!nome || !email || !mensagem) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }

        try {
            await MailService.sendContactForm(nome, email, mensagem);
            res.status(200).json({ success: true, message: 'E-mail enviado com sucesso.' });
        } 
        catch (error) {
            console.error("Erro no ContactController:", error);
            res.status(500).json({ error: 'Ocorreu uma falha interna ao tentar enviar a mensagem.' });
        }
    }
};

module.exports = ContactController;