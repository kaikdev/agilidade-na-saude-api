const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Caminho do banco de dados SQLite
const dbPath = path.resolve(__dirname, "../../database.sqlite");

// Criar e conectar ao banco de dados
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectando ao banco...");
    // Ativar restrições de chave estrangeira
    db.run("PRAGMA foreign_keys = ON;");
  }
});

module.exports = db;