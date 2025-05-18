require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;
const db = require("./config/initDB");


// Configurações básicas do servidor
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Rota inicial de teste
app.get("/", (req, res) => {
  res.json({ message: "API está funcionando!" });
});
  
// Rotas de usuário
const userRoutes = require("./routes/userRoutes");
app.use("/api", userRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api", adminRoutes);

const queriesRoutes = require("./routes/queriesRoutes");
app.use("/api", queriesRoutes);

// Rotas de autenticação
const authRoutes = require("./routes/authRoutes");
app.use("/api", authRoutes);

// Rotas de alteração de senha
const passwordRoutes = require("./routes/passwordRoutes");
app.use("/api", passwordRoutes);


// Só inicie o servidor se não estiver em ambiente de teste
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
  });
}

module.exports = app; // Exporta o app para ser usado nos testes
