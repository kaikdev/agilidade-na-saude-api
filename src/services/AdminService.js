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

  getAppointmentsById: async (userId) => {
    return await AdminModel.getAppointmentsById(userId);
  },

  createAppointment: async (adminData) => {
    const date = UserRepository.validateAndFormatInputDate(
      adminData.service_date
    );
    adminData.service_date = date.myDate;

    const existingAppointments = await AdminModel.getAppointmentsByIdAndDate(
      adminData.user_id,
      adminData.service_date
    );
    if (existingAppointments.length > 0) {
      throw new Error("Já existe um agendamento para esta data.");
    }
    await AdminModel.createAppointment(adminData);
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
      throw new Error("Erro no serviço de busca de agendamentos: " + error.message);
    }
  },
 
  deleteAppointment: async (id, userId) => {
    const appointment = await AdminModel.getAppointmentsById(userId);
    if (!appointment) {
      throw new Error("Agendamento não encontrado.");
    }
    await AdminModel.deleteAppointmentById(id);
    
    return "Agendamento excluído com sucesso.";
  }
  
};

module.exports = AdminService;
