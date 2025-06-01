const bcrypt = require("bcryptjs");
const UserModel = require("../models/UserModel");
const UserRepository = require("../repository/UserRepository");
const e = require("express");

const UserService = {
  // Criar novo usuário com hash de senha
  createUser: async (name, email, password, role, birth_date) => {
    // Verifica se o e-mail já está cadastrado
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error("E-mail já cadastrado.");
    }

    // Validação do e-mail
    if (!UserRepository.validateEmail(email)) {
      throw new Error(
        "E-mail inválido. O e-mail não atende os parâmetros necessários."
      );
    }

    // Validação da senha
    if (!UserRepository.validatePassword(password)) {
      throw new Error(
        "A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial."
      );
    }

    // Validação da data de nascimento
    const birthDateValidation =
      UserRepository.validateAndFormatBirthDate(birth_date);
    if (birthDateValidation.error) {
      throw new Error(birthDateValidation.error);
    }

    // Hashing da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criação do usuário
    const userId = await UserModel.create(
      name,
      email,
      hashedPassword,
      role,
      birthDateValidation.formattedDate
    );
    return userId;
  },

  // Buscar usuário por e-mail
  getUserByEmail: async (email) => {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error("Usuário não encontrado.");
    }
    return user;
  },

  // Buscar usuário por ID
  getUserById: async (id) => {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new Error("Usuário não encontrado.");
    }
    return user;
  },

  // Atualizar dados do usuário
  updateUser: async (id, name, email) => {
    const changes = await UserModel.update(id, name, email);
    if (changes === 0) {
      throw new Error("Usuário não encontrado ou sem alterações.");
    }
    return "Usuário atualizado com sucesso.";
  },

  // Atualizar senha do usuário
  updatePassword: async (id, newPassword) => {
    const changes = await UserModel.updatePassword(id, newPassword);
    if (changes === 0) {
      throw new Error("Usuário não encontrado.");
    }
    return "Senha atualizada com sucesso.";
  },

  // Deletar usuário
  deleteUser: async (id) => {
    const changes = await UserModel.delete(id);
    if (changes === 0) {
      throw new Error("Usuário não encontrado.");
    }
    return "Usuário excluído com sucesso.";
  },

  // Listar todos os usuários
  listUsers: async () => {
    const users = await UserModel.findAll();
    return users;
  },
  appointmentsList: async () => {
    const appointments = await UserModel.getAllAppointments();
    return appointments;
  },
  listAllPassword: async (password) => {
    try {
      const passwords = await UserModel.listAllPassword(password);
      return passwords;
    } catch (error) {
      throw new Error("Erro ao listar senhas: " + error.message);
    }
  },
  getAppointmentsById: async (id) => {
    try {
      const appointment = await UserModel.getAllAppointmentsById(id);
      return appointment;
    } catch (error) {
      throw new Error("Erro ao buscar agendamento: " + error.message);
    }
  },
  insertPatientInQueue: async (data) => {
    const { serviceId, userId, priority, level, password } = data;

    try {
      const existingListQueue = await UserModel.checkPatientInQueue(
        serviceId,
        userId
      );
      if (existingListQueue) {
        return {
          success: false,
          message: "Você já marcou esta consulta.",
        };
      } else {
        const insertPatientInQueue = await UserModel.insertPatientInQueue(data);
        return {
          success: true,
          insertPatientInQueue,
          priority: data.priority,
          password: data.password,
          message: "Agendamento realizado com sucesso!",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Erro ao processar agendamento.",
      };
    }
  },

  updateQtdAttendance: async (newQtd, serviceId) => {
    const result = await UserModel.updateQtdAttendance(newQtd, serviceId);
    return result;
  },
  appointmentsScheduled: async (userId, role) => {
    try {
      console.log(
        "Buscando agendamentos para o usuário:",
        userId,
        "com a função:",
        role
      );
      const appointments = await UserModel.getAppointmentsByUserId(
        null,
        userId,
        role
      );
      return appointments;
    } catch (error) {
      throw new Error("Erro ao buscar agendamentos: " + error.message);
    }
  },

  getResumeAppointments: async (userId) => {
    try {
      const resumeAppointments = await UserModel.getResumeAppointments(userId);

      const serviceIds = resumeAppointments.flatMap((appointment) =>
        appointment.data.map((item) => item.service_id)
      );

      console.log(serviceIds); // Isso vai pegar todos os 'service_id' dentro de 'data'

      if (!resumeAppointments) {
        throw new Error("Nenhum resumo de agendamentos encontrado.");
      }

      return resumeAppointments;
    } catch (error) {
      throw new Error(
        "Erro ao buscar resumo de agendamentos: " + error.message
      );
    }
  },
};

module.exports = UserService;
