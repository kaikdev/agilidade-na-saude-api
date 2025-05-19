const logEvent = require("../services/LogService");
const AdminService = require("../services/AdminService");
const UserModel = require("../models/UserModel");
const UserRepository = require("../repository/UserRepository");
const bcrypt = require("bcryptjs");

const AdminController = {
  // Criar novo administrador
  createAdmin: async (req, res) => {
    const requiredFields = [
      "name",
      "email",
      "password",
      "crm",
      "specialty",
      "presentation",
    ];

    const adminData = req.body;

    // Verifica se todos os campos obrigatórios estão preenchidos
    const missingFields = requiredFields.filter((field) => !adminData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Os seguintes campos são obrigatórios: ${missingFields.join(
          ", "
        )}`,
      });
    }
    // Defina o role como 'admin' no controlador
    adminData.role = "admin";

    try {
      const userId = await AdminService.createAdmin(adminData);

      logEvent(`Conta criada - Administrador ID: ${userId}`);

      return res.status(201).json({
        success: true,
        message: "Administrador criado com sucesso!",
        userId: userId,
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
    

    if(id !== userId) {

      return res.status(403).json({
        error: "Você não tem permissão para acessar essas informações.",
      });
    }

    try {
      const userAdmin = await AdminService.getAdminById(id);
      if (!userAdmin) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
    const AdminWithLinks = userAdmin.map(({ password,created_at,birth_date, ...admin }) => ({
        ...admin,
        links: {
          update: `http://localhost:3000/api/admin/update/${admin.id}`,
          delete: `http://localhost:3000/api/admin/delete/delete/${admin.id}`,
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
    const { id } = req.params;
    const { name, email, password, crm, specialty, presentation } = req.body;
    const userId = req.user?.id;

    const newPassword = password;

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
    console.log("senha Nova", newPassword);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("Nova Senha", hashedPassword);
  },

  //Pega todas as consulta de um usuario adm especifico
  getAllAppointments: async (req, res) => {
    const id = req.user.id;
    try {
      const services = await AdminService.listAllAppointments(id);
      const servicesWithLink = services.map(({created_at, ...appointment}) => ({
        ...appointment,
        link: {
          getForId: `https://localhost:3000/api/admin/appointments/${appointment.id}`,
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

      const appointmentsWithLinks = getAppointments.map(({created_at ,...appointment}) => ({
        ...appointment,
        links: {
          update: `http://localhost:3000/api/admin/appointments/update/${appointment.id}`,
          delete: `http://localhost:3000/api/admin/appointments/delete/${appointment.id}`,
        },
      }));

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
            update: `http://localhost:3000/api/admin/appointments/update/${appointment.id}`,
            delete: `http://localhost:3000/api/admin/appointments/delete/${appointment.id}`,
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
      const message = await AdminService.deleteAppointment(id);
      logEvent(
        `Agendamento excluído - Usuário ID: ${userId}, Agendamento ID: ${id}`
      );
      res.json({ message });
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
          getById: `http://localhost:3000/api/admin/scheduled/appointments/${appointment.user_id}`,
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
          finalizeQueries: `http://localhost:3000/api/admin/scheduled/appointments/finalizeQueries/${scheduledAppointments.consultation_id}`,
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
  finalizeScheduledAppointments: async (req, res) => {
    const { id } = req.params;
    try {
      const scheduledAppointments =
        await AdminService.finalizeScheduledAppointments(id);

      return res.status(200).json({
        message: "Agendamentos encontrados!",
        appointments: scheduledAppointments,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Erro ao buscar os agendamentos." + error.message,
      });
    }
  },

 getTodayPasswords: async (req, res) => {
  try {
    const data = await AdminService.fetchTodayPasswords();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar senhas da fila de hoje."  + error.message });
  }
},


 
};

module.exports = AdminController;
