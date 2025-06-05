require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/initDB");
const app = express();

// Configurações básicas do servidor
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

const userRoutes = require("./routes/userRoutes");// Rotas de usuário
const adminRoutes = require("./routes/adminRoutes");// Rotas de Admin
const queriesRoutes = require("./routes/queriesRoutes");//Rota da fila
const authRoutes = require("./routes/authRoutes");// Rotas de autenticação
const passwordRoutes = require("./routes/passwordRoutes");// Rotas de alteração de senha

app.use("/api", userRoutes);
app.use("/api", adminRoutes);
app.use("/api", queriesRoutes);
app.use("/api", authRoutes);
app.use("/api", passwordRoutes);

// Rota inicial de teste
app.get("/", (req, res) => {
  res.json({ message: "API está funcionando!" });
});

const PORT = process.env.PORT || 2000;
// Só inicie o servidor se não estiver em ambiente de teste
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
  });
}

module.exports = app; // Exporta o app para ser usado nos testes
