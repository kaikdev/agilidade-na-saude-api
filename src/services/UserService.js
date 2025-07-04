const bcrypt = require("bcryptjs");
const UserModel = require("../models/UserModel");
const UserRepository = require("../repository/UserRepository");
const e = require("express");

const UserService = {
  // Criar novo usuário com hash de senha
  createUser: async (userData) => {
    const { name, email, cpf, password, role, birth_date, documentImagePath } = userData;

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

    // Validação do cpf
    if (!(await UserRepository.validateCpf(cpf))) {
      throw new Error(
        "CPF inválido. O CPF não atende os parâmetros necessários."
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

    try {
      const userId = await UserModel.create(
        name,
        email,
        cpf,
        hashedPassword,
        role,
        birthDateValidation.formattedDate,
        documentImagePath
      );
      return userId;
    } catch (error) {
      if (error.message.includes("UNIQUE constraint failed: users.cpf")) {
        throw new Error("Esse CPF já está cadastrado no sistema.");
      }
      throw error;
    }
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
  updateUser: async (id, updateData) => {
    const changes = await UserModel.update(id, updateData);

    if (changes === 0) {
      throw new Error("Usuário não encontrado ou nenhum dado foi alterado.");
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

      if (!resumeAppointments || resumeAppointments.length === 0) throw new Error("Nenhum resumo de agendamentos encontrado.");

      const cleanedAppointments = resumeAppointments.map((appointment) => ({
        ...appointment,
        data: appointment.data.map(({ user_name, email, ...rest }) => rest),
      }));

      const serviceIds = resumeAppointments.flatMap((appointment) =>
        appointment.data.map((item) => item.service_id)
      );

      const getServiceNames = await UserModel.getAdminBydIds(serviceIds);

      if (!getServiceNames || getServiceNames.length === 0) throw new Error("Nenhum serviço encontrado para os IDs fornecidos.");

      const cleanedGetServiceNames = getServiceNames.map(({ specialty, locality, id_admin_data, service_user_id, ...rest }) => rest);

      //merge
      const mergedAppointments = cleanedAppointments.map((appointment) => ({
        ...appointment,
        data: appointment.data.map((item) => {
          const service = cleanedGetServiceNames.find(
            (s) => s.id_service === item.service_id
          );
          return {
            ...item,
            ...service, // merge das informações do médico com o resumo do agendamento
          };
        }),
      }));

      const finalResumeAppointments = mergedAppointments.map((appointment) => ({
        ...appointment,
        data: appointment.data.map(({ id_service, id_admin, ...rest }) => rest),
      }));

      return finalResumeAppointments;

    } catch (error) {
      throw new Error(
        "Erro ao buscar resumo de agendamentos: " + error.message
      );
    }
  },

  getQueueStatusForUser: async (scheduledId, userId) => {
    const userAppointment = await UserModel.getUserAppointmentDetails(scheduledId, userId);

    if (!userAppointment) {
      throw new Error("Agendamento não encontrado ou você não está mais na fila de espera.");
    }

    const fullQueue = await UserModel.getQueueForService(userAppointment.service_id);

    const userIndex = fullQueue.findIndex(patient => patient.scheduled_id === scheduledId);

    if (userIndex === -1) {
      throw new Error("Não foi possível encontrar sua posição na fila.");
    }

    return {
      specialty: userAppointment.specialty,
      locality: userAppointment.locality,
      yourPosition: userIndex + 1,
      peopleInFront: userIndex,
      totalInQueue: fullQueue.length
    };
  },
};

module.exports = UserService;
