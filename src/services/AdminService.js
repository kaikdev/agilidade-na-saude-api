const bcrypt = require("bcryptjs");
const UserModel = require("../models/UserModel");
const UserRepository = require("../repository/UserRepository");
const AdminModel = require("../models/AdminModel");
const { CONSTRAINT } = require("sqlite3");

const AdminService = {
  createAdmin: async (adminData) => {
    const { name, email, password, role, crm, specialty, presentation } =
      adminData;

    // Verifica se o e-mail já está cadastrado
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error("E-mail já cadastrado.");
    }

    // Valida o e-mail
    if (!UserRepository.validateEmail(email)) {
      throw new Error("E-mail inválido.");
    }

    // Valida a senha
    if (!UserRepository.validatePassword(password)) {
      throw new Error("Senha fraca.");
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const userId = await UserModel.create(
        name,
        email,
        hashedPassword,
        role,
        null
      );

      await AdminModel.createAdminData(userId, crm, specialty, presentation);

      return userId;
    } catch (error) {
      throw new Error(`Erro ao criar admin: ${error.message}`);
    }
  },

  getAdminById: async (id) => {
    const user = await AdminModel.getAdminById(id);
    if (!user) {
      throw new Error("Usuário não encontrado.");
    }
    return user;
  },

  listAllAppointments: async (id) => {
    const users = await AdminModel.findAllAppointments(id);
    return users;
  },

  getAppointmentsById: async (userId) => {
    return await AdminModel.getAppointmentsById(userId);
  },

  createAppointment: async (adminData) => {
    const date = UserRepository.validateAndFormatInputDate(
      adminData.service_date
    );
    adminData.service_date = date.myDate;
    console.log(adminData.service_date);
    try {
      const existingAppointments = await AdminModel.getAppointmentsByIdAndDate(
        adminData.user_id,
        adminData.service_date
      );
      if (existingAppointments.length > 0) {
        throw new Error("Já existe um agendamento para esta data.");
      }
      await AdminModel.createAppointment(adminData);
    } catch (error) {
      throw new Error(`Erro ao criar serviço: ${error.message}`);
    }
  },

  updateAppointment: async (body, id, userId) => {
    const date = UserRepository.validateAndFormatInputDate(body.service_date);
    body.service_date = date.myDate;

    const existingAppointments = await AdminModel.getAppointmentsByIdAndDate(
      id,
      body.service_date
    );

    if (existingAppointments.length > 0) {
      throw new Error("Já existe um agendamento para esta data.");
    }
    await AdminModel.updateAppointment(body, id);
  },

  searchAppointments: async (query) => {
    try {
      return await AdminModel.searchAppointments(query);
    } catch (error) {
      throw new Error(
        "Erro no serviço de busca de agendamentos: " + error.message
      );
    }
  },

  deleteAdmin: async (id) => {
    const admin = await AdminModel.getAdminById(id);
    if (!admin || admin.length === 0) {
      throw new Error("Agendamento não encontrado.");
    }

    try {
      await AdminModel.deleteAdminById(id);
    } catch (error) {
      throw new Error(
        "Erro ao excluir serviço de agendamentos: " + error.message
      );
    }

    return "Agendamento excluído com sucesso.";
  },

  deleteAppointment: async (id) => {
    const appointment = await AdminModel.getAppointmentsById(id);
    if (!appointment || appointment.length === 0) {
      throw new Error("Agendamento não encontrado.");
    }

    try {
      await AdminModel.deleteAppointmentById(id);
    } catch (error) {
      throw new Error(
        "Erro ao excluir serviço de agendamentos: " + error.message
      );
    }

    return "Agendamento excluído com sucesso.";
  },
  getScheduledAppointments: async (userId) => {
    const service = await AdminModel.findAllAppointments(userId);
    const allServicesId = service.map((service) => service.id);

    try {
      const scheduledAppointments = await AdminModel.getScheduledAppointments(
        allServicesId
      );
      if (!scheduledAppointments || scheduledAppointments.length === 0) {
        throw new Error("Nenhum agendamento encontrado.");
      }
      return scheduledAppointments;
    } catch (error) {
      throw new Error("Erro ao buscar agendamentos: " + error.message);
    }
  },
  getScheduledAppointmentsById: async (id) => {
    try {
      const scheduledAppointments =
        await AdminModel.getScheduledAppointmentsByUserId(id);
      if (!scheduledAppointments || scheduledAppointments.length === 0) {
        throw new Error("Nenhum agendamento encontrado.");
      }
      return scheduledAppointments;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  finalizeScheduledAppointments: async (id) => {
    try {
      const result = await AdminModel.finalizeScheduledAppointments(id);

      if (result.changes === 0) {
        throw new Error("Nenhum agendamento encontrado com esse ID.");
      }
      return result;
    } catch (err) {
      throw new Error("Erro ao finalizar o agendamento: " + err.message);
    }
  },

  fetchTodayPasswords: async () => {
    try {
      const passwords = await AdminModel.getTodayPasswords();
      return passwords;
    } catch (err) {
      throw new Error("Erro no serviço ao buscar senhas:" + err.message);
    }
  },
};

module.exports = AdminService;
