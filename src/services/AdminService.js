const bcrypt = require("bcryptjs");
const UserModel = require("../models/UserModel");
const UserRepository = require("../repository/UserRepository");
const AdminModel = require("../models/AdminModel");
const { CONSTRAINT } = require("sqlite3");

const AdminService = {
  createAdmin: async (adminData) => {
    const { name, email, cpf, password, role, crm, specialty, presentation, profileImagePath } = adminData;

    // Verifica se o e-mail já está cadastrado
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error("E-mail já cadastrado.");
    }

    // Valida o e-mail
    if (!UserRepository.validateEmail(email)) {
      throw new Error("E-mail inválido.");
    }

    if (!(await UserRepository.validateCpf(cpf))) {
      throw new Error(
        "CPF inválido. O CPF não atende os parâmetros necessários."
      );
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
        cpf,
        hashedPassword,
        role,
        null,
        profileImagePath
      );

      await AdminModel.createAdminData(userId, crm, specialty, presentation);

      return userId;
    }
    catch (error) {
      if (error.message.includes("UNIQUE constraint failed: users.cpf")) {
        throw new Error("Esse CPF já está cadastrado no sistema.");
      }
      throw error;
    }
  },

  updateAdmin: async (id, updateData) => {
    if (updateData.email) {
      if (!UserRepository.validateEmail(updateData.email)) {
        throw new Error("Formato de e-mail inválido.");
      }
   
      const existingUser = await UserModel.findByEmail(updateData.email);

      if (existingUser && existingUser.id !== id) {
        throw new Error("Este e-mail já está em uso por outra conta.");
      }
    }

    if (updateData.password) {
      if (!UserRepository.validatePassword(updateData.password)) {
        throw new Error("Senha fraca. Deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.");
      }
      
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const changes = await AdminModel.update(id, updateData);
    if (changes === 0) {
      throw new Error("Administrador não encontrado ou nenhum dado foi alterado.");
    }

    return "Administrador atualizado com sucesso.";
  },

  getAdminById: async (id) => {
    const user = await AdminModel.getAdminById(id);
    if (!user) {
      throw new Error("Usuário não encontrado.");
    }
    return user;
  },

  deleteAdmin: async (id) => {
    const admin = await AdminModel.getAdminById(id);
    if (!admin || admin.length === 0) {
      throw new Error("Administrador não encontrado.");
    }

    const changes = await AdminModel.deleteById(id);

    if (changes === 0) {
      throw new Error("Falha ao excluir o usuário principal. Verifique a consistência do banco de dados.");
    }

    return "Administrador excluído com sucesso.";
  },

  listAllAppointments: async (id) => {
    const users = await AdminModel.findAllAppointments(id);
    return users;
  },

  getAppointmentsById: async (id, userId) => {
    return await AdminModel.getAppointmentsById(id, userId);
  },

  createAppointment: async (adminData) => {
    const date = UserRepository.validateAndFormatInputDate(
      adminData.service_date
    );
    adminData.service_date = date.myDate;

    try {
      const existingAppointments =
        await AdminModel.findAppointmentsByAdminIdAndDate(
          adminData.user_id,
          adminData.service_date
        );
      if (existingAppointments && existingAppointments.length > 0) {
        throw new Error(
          "Já existe um agendamento para esta data com este administrador."
        );
      }
      await AdminModel.createAppointment(adminData);
    } catch (error) {
      throw new Error(`Erro ao criar serviço: ${error.message}`);
    }
  },

  updateAppointment: async (body, id, userId) => {
    const appointment = await AdminModel.getAppointmentsById(id, userId);
    if (!appointment) {
      throw new Error(
        "Você não tem permissão para editar este agendamento ou o agendamento não existe."
      );
    }

    if (body.service_date) {
      const formatted = UserRepository.validateAndFormatInputDate(
        body.service_date
      );
      body.service_date = formatted.myDate;

      const existing = await AdminModel.findAppointmentsByAdminIdAndDate(
        userId,
        body.service_date,
        id
      );

      if (existing && existing.length > 0) {
        throw new Error(
          "Já existe outro agendamento para esta data com este administrador."
        );
      }
    }

    return await AdminModel.updateAppointment(body, id);
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

  deleteAppointment: async (id, userId) => {
    const appointment = await AdminModel.getAppointmentsById(id, userId);

    if (!appointment || appointment.length === 0) {
      throw new Error("Agendamento não encontrado.");
    }

    try {
      await AdminModel.deleteAppointmentById(id, userId);
    } catch (error) {
      throw new Error(
        "Erro ao excluir serviço de agendamentos: " + error.message
      );
    }

    return;
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

  finalizeScheduledAppointments: async (id, userId, role) => {
    try {
      const result = await AdminModel.finalizeScheduledAppointments(id);

      if (result.changes === 0)
        throw new Error("Nenhum agendamento encontrado com esse ID.");

      const getAppointmentsByUserId = await UserModel.getAppointmentsByUserId(
        id,
        userId,
        role
      );

      if (!getAppointmentsByUserId) {
        throw new Error("Nenhum agendamento encontrado para o usuário.");
      }
      const createdResumePatient = await AdminModel.createdResumePatient(
        getAppointmentsByUserId
      );

      if (!createdResumePatient) {
        throw new Error("Erro ao criar o resumo do agendamento.");
      }

      const deletedQueryAppointment =
        await AdminModel.deleteQueryAppointmentById(id);

      if (!deletedQueryAppointment) {
        throw new Error("Erro ao finalizar o agendamento.");
      }

      return getAppointmentsByUserId;
    } catch (err) {
      throw new Error("Erro ao finalizar o agendamento: " + err.message);
    }
  },

  //Modificado
  getQueriesMyPatient: async (userId, serviceId) => {
    try {
      const queries = await AdminModel.getQueriesMyPatient(userId, serviceId);

      if (!queries) throw new Error("Nenhuma consulta encontrada para o paciente.");

      return queries;
    } catch (error) {
      throw new Error("Erro ao buscar consultas do paciente: " + error.message);
    }
  },

  prioritizePatientInQuerie: async (id) => {
    console.log("fase 2")
    //console.log(`${id} - ${userId}`)
    try {
      const prioritize = await AdminModel.prioritizePatientInQuerie(id);

      if (!prioritize || prioritize.length === 0) throw new Error("Agendamento não encontrado.");

      return prioritize;
    } catch (error) {
      throw new Error(
        "Erro ao priorizar paciente na consulta: " + error.message
      );
    }
  }
};

module.exports = AdminService;
