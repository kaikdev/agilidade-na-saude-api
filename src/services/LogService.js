const fs = require("fs");
const path = require("path");

const logFilePath = path.join(__dirname, "../../logs/app.log");

// Função para registrar logs
const logEvent = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  // Criar diretório de logs se não existir
  if (!fs.existsSync(path.dirname(logFilePath))) {
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
  }

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) console.error("Erro ao registrar log:", err);
  });
};

module.exports = logEvent;
