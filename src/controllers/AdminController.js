const logEvent = require("../services/LogService");
const AdminService = require("../services/AdminService");
const UserModel = require("../models/UserModel");
const UserRepository = require("../repository/UserRepository");
const bcrypt = require("bcryptjs");

const baseUrl = process.env.BASE_API_URL;

const AdminController = {
  // Criar novo administrador
  createAdmin: async (req, res) => {
    const requiredFields = [
      "name",
      "email",
      "cpf",
      "password",
      "crm",
      "specialty",
      "presentation",
    ];

    const adminData = req.body;

    // Caminho da Imagem
    if (req.file) {
      adminData.profileImagePath = `/uploads/admins/${req.file.filename}`;
    }

    // Verifica campos obrigatórios
    const missingFields = requiredFields.filter((field) => !adminData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Os seguintes campos são obrigatórios: ${missingFields.join(", ")}`,
      });
    }

    adminData.role = "admin";

    try {
      const userId = await AdminService.createAdmin(adminData);

      logEvent(`Conta criada - Administrador ID: ${userId}`);

      return res.status(201).json({
        success: true,
        message: "Administrador criado com sucesso!",
        userId,
      });
    } catch (err) {
      console.error("Erro no controller:", err);
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  },

  //pega as informação do usuario adm
  getAdmById: async (req, res) => {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;

    if (id !== userId) {

      return res.status(403).json({
        error: "Você não tem permissão para acessar essas informações.",
      });
    }

    try {
      const userAdmin = await AdminService.getAdminById(id);
      if (!userAdmin) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
      const AdminWithLinks = userAdmin.map(({ password, created_at, birth_date, ...admin }) => ({
        ...admin,
        links: {
          update: `${baseUrl}/api/admin/update/${admin.id}`,
          delete: `${baseUrl}/api/admin/delete/delete/${admin.id}`,
        },
      }));

      return res.status(201).json({
        success: true,
        data: AdminWithLinks,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateAdmin: async (req, res) => {
    const id = parseInt(req.params.id);
    const userId = req.user.id;

    if (id !== userId) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const { name, email, password, specialty, presentation } = req.body;

    try {

      const updateAdmin = await AdminService.updateAdmin(
        id,
        userId,
        name,
        email,
        password,
        specialty,
        presentation,
      );

      return res.status(200).json({
        message: "Administrador atualizado com sucesso!",
        data: updateAdmin,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  },

  //Pega todas as consulta de um usuario adm especifico
  getAllAppointments: async (req, res) => {
    const id = req.user.id;
    try {
      const services = await AdminService.listAllAppointments(id);
      const servicesWithLink = services.map(({ created_at, ...appointment }) => ({
        ...appointment,
        link: {
          getForId: `${baseUrl}/api/admin/appointments/${appointment.id}`,
          update: `${baseUrl}/api/admin/appointments/update/${appointment.id}`,
          delete: `${baseUrl}/api/admin/appointments/delete/${appointment.id}`,
        },
      }));
      return res.json(servicesWithLink);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar as suas consultas." });
    }
    return;
  },

  //pega a consulta especifica de um usuario adm
  getAppointmentsById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const getAppointments = await AdminService.getAppointmentsById(id, userId);

      if (getAppointments.length === 0) {
        throw new Error("Você não tem permissão para acessar este agendamento, agendamento não corresponde ao seu usúario");
      }

      const appointmentsWithLinks = {
        ...getAppointments,
        links: {
          update: `${baseUrl}/api/admin/appointments/update/${getAppointments.id}`,
          delete: `${baseUrl}/api/admin/appointments/delete/${getAppointments.id}`,
        },
      };

      return res.status(200).json({
        message: "Agendamentos encontrados!",
        appointments: appointmentsWithLinks,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message,
      });

    }
  },

  createAppointments: async (req, res) => {
    const requiredFields = [
      "user_id",
      "specialty",
      "locality",
      "qtd_attendance",
      "service_date",
    ];

    const adminData = req.body;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    adminData.user_id = userId;

    const isEmpty = (val) => val === undefined || val === null || val === "";
    const missingFields = requiredFields.filter((field) =>
      isEmpty(adminData[field])
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Os seguintes campos são obrigatórios: ${missingFields.join(
          ", "
        )}`,
      });
    }
    try {
      const created = await AdminService.createAppointment(adminData);
      return res.status(201).json({
        menssage: "Agendamento criado com sucesso!",
        data: created,
      });
    } catch (error) {
      logEvent("Erro ao criar agendamento:", error);
      return res.status(500).json({
        error: error.message,
      });
    }
  },

  updateAppointments: async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    const userId = req.user?.id;

    try {
      const updated = await AdminService.updateAppointment(body, id, userId);
      return (
        res.status(200).json({
          message: "Agendamento atualizado com sucesso!",
          data: updated,
        }),
        logEvent("Agendamento atualizado com sucesso!", body.user_id)
      );
    } catch (error) {
      logEvent("Erro ao atualizar agendamento:", error);
      return res.status(500).json({
        error: error.message,
      });
    }
  },

  searchAppointments: async (req, res) => {
    const { query } = req.query; // Pega o valor da query string
    const userId = req.user?.id;

    if (!query) {
      return res.status(400).json({
        message: "Por favor, forneça um valor para a pesquisa.",
      });
    }

    try {
      const appointments = await AdminService.searchAppointments(query);

      if (appointments.length > 0) {
        // Adiciona links de atualização e exclusão
        const appointmentsWithLinks = appointments.map((appointment) => ({
          ...appointment,
          links: {
            update: `${baseUrl}/api/admin/appointments/update/${appointment.id}`,
            delete: `${baseUrl}/api/admin/appointments/delete/${appointment.id}`,
          },
        }));

        return res.status(200).json({
          message: "Consultas encontradas!",
          appointments: appointmentsWithLinks,
        });
      }

      return res.status(404).json({
        message: "Nenhum agendamento encontrado.",
      });
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      return res.status(500).json({
        message: "Erro ao buscar os agendamentos.",
      });
    }
  },

  delete: async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    try {
      const message = await AdminService.deleteAdmin(id);
      logEvent(
        `Agendamento excluído - Usuário ID: ${userId}, Agendamento ID: ${id}`
      );
      res.json({ message });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  deleteAppointments: async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    try {
      const message = await AdminService.deleteAppointment(id, userId);
      logEvent(
        `Agendamento excluído - Usuário ID: ${userId}, Agendamento ID: ${id}`
      );
      res.json({ message: "Agendamento excluído com sucesso!" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  getScheduledAppointments: async (req, res) => {
    const userId = req.user?.id;
    try {
      const scheduledAppointments = await AdminService.getScheduledAppointments(
        userId
      );

      const output = scheduledAppointments.map((appointment) => ({
        ...appointment,
        links: {
          getById: `${baseUrl}/api/admin/scheduled/appointments/${appointment.user_id}`,
        },
      }));
      return res.status(200).json({
        message: "Agendamentos encontrados!",
        appointments: output,
      });
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      return res.status(500).json({
        message: "Erro ao buscar os agendamentos.",
      });
    }
  },

  getScheduledAppointmentsById: async (req, res) => {
    const { id } = req.params;
    try {
      const scheduledAppointments =
        await AdminService.getScheduledAppointmentsById(id);

      const output = {
        ...scheduledAppointments,
        links: {
          finalizeQueries: `${baseUrl}/api/admin/scheduled/appointments/finalizeQueries/${scheduledAppointments.consultation_id}`,
        },
      };

      return res.status(200).json({
        message: "Agendamentos encontrados!",
        appointments: output,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Erro ao buscar os agendamentos." + error.message,
      });
    }
  },
  // AdminController.js
  finalizeScheduledAppointments: async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = "admin";

    try {
      const scheduledAppointments = await AdminService.finalizeScheduledAppointments(id, userId, role);

      return res.status(200).json({
        message: "Agendamentos encontrados!",
        appointments: scheduledAppointments,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message,
      });
    }
  },
  getQueriesMyPatient: async (req, res) => {
    const userId = req.user?.id;
    try {
      const queries = await AdminService.getQueriesMyPatient(userId);

      const output = queries.map((appointment) => ({
        ...appointment,
        links: {
          prioritizePatient: `${baseUrl}/api/admin/appointments/prioritizePatient/${appointment.user_id}`,
        },
      }));

      return res.status(200).json({
        message: "Consultas encontradas!",
        output,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message,
      });
    }
  },
  prioritizePatientInQuerie: async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
      const prioritizedPatient = await AdminService.prioritizePatientInQuerie(id);

      return res.status(200).json({
        message: "Paciente priorizado com sucesso!",
        data: prioritizedPatient,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  },
};

module.exports = AdminController;
