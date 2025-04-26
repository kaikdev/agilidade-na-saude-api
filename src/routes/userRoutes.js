const express = require("express");
const UserController = require("../controllers/UserController");
const Auth = require("../config/auth");
const authorize = require("../middlewares/authorize");

const router = express.Router();

// Definição das rotas de usuário publicas
router.post("/users", UserController.createUser); // Criar usuário

// Aplicar autenticação em todas as rotas
router.get("/users/:id", Auth.verifyToken, UserController.getUserById);  // Qualquer usuário autenticado pode ver seu próprio perfil
router.put("/users/:id", Auth.verifyToken, UserController.updateUser);  // Atualizar usuário autenticado
router.delete("/users/:id", Auth.verifyToken, UserController.deleteUser);  // Excluir conta própria

// Rotas restritas a administradores
router.get("/users", Auth.verifyToken, authorize(["admin"]), UserController.listUsers);  // Apenas admin pode listar todos os usuários

module.exports = router;
