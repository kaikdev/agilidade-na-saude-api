
const express = require("express");
const UserController = require("../controllers/UserController");
const Auth = require("../config/auth");
const authorize = require("../middlewares/authorize");

const router = express.Router();

const upload = require('../middlewares/uploadMiddleware');

// Definição das rotas de usuário publicas
router.post("/users", upload.single("documentImage"), UserController.createUser); // Criar usuário

// Aplicar autenticação em todas as rotas
router.get("/users/:id", Auth.verifyToken, authorize(["user"]), UserController.getUserById);  // Qualquer usuário autenticado pode ver seu próprio perfil
router.delete("/users/delete/:id", Auth.verifyToken, authorize(["user"]), UserController.deleteUser);  // Excluir conta própria

// inscrição do usuario na fila de atendimento
router.get("/users/appointments/list", Auth.verifyToken, authorize(["user"]), UserController.appointmentsList);
router.post("/users/appointments/createListOfService/:id", Auth.verifyToken, authorize(["user"]), UserController.createLisOfService)
router.get("/users/appointments/scheduled", Auth.verifyToken, authorize(["user"]), UserController.appointmentsScheduled); // Listar agendamentos do usuário autenticado

//Pegar o resumo das consultas do usuário
router.get("/users/Appointments/getResume", Auth.verifyToken, authorize(["user"]), UserController.getResumeAppointments); // Listar agendamentos do usuário autenticado

// Rotas restritas a administradores
router.get("/users", Auth.verifyToken, authorize(["admin"]), UserController.listUsers);  // Apenas admin pode listar todos os usuários

module.exports = router;