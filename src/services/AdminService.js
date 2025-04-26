const bcrypt = require("bcryptjs");
const UserModel = require("../models/UserModel");
const UserRepository = require("../repository/UserRepository");
const AdminModel = require("../models/AdminModel");

const AdminService = {
  createAdmin: async (adminData) => {
    const { name, email, password, role, crm, specialty, presentation } = adminData;

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
      const userId = await UserModel.create(name, email, hashedPassword, role, null);

      console.log("ID do usuário criado:", userId); // Log adicional
      await AdminModel.createAdminData(userId, crm, specialty, presentation);
    
      return userId;
    } catch (error) {
      throw new Error(`Erro ao criar admin: ${error.message}`);
    }
  },

   getAppointmentsById: async (userId) => {
    return await AdminModel.getAppointmentsById(userId);
  },

  createAppointment: async (appointmentData) => {
  const  date = UserRepository.validateAndFormatInputDate( appointmentData.service_date );
  appointmentData.service_date = date.formattedDate;

  const existingAppointments = await AdminModel.getAppointmentsByIdAndDate(
    appointmentData.user_id,
    appointmentData.service_date
  );

  if (existingAppointments.length < 0) {
    throw new Error("Já existe um agendamento para esta data.");
  }

  await AdminModel.createAppointment(appointmentData);
},
updateAppointment: async (appointmentData, id) => {
  const  date = UserRepository.validateAndFormatInputDate( appointmentData.service_date );
  appointmentData.service_date = date.formattedDate;
  
  const existingAppointments = await AdminModel.getAppointmentsByIdAndDate(
    appointmentData.user_id,
    appointmentData.service_date
  );
  if (existingAppointments.length > 0) {
    throw new Error("Já existe um agendamento para esta data.");
  }
  await AdminModel.updateAppointment(appointmentData, id);  
}
};

module.exports = AdminService;
