const express = require("express");
const PasswordController = require("../controllers/PasswordController");
const Auth = require("../config/auth");

const router = express.Router();

// Alterar senha (usuário autenticado)
router.put(
  "/change-password",
  Auth.verifyToken,
  PasswordController.changePassword
);

// Recuperação de senha
router.post("/forgot-password", PasswordController.forgotPassword);
router.post("/reset-password/:id", PasswordController.resetPassword);

module.exports = router;
