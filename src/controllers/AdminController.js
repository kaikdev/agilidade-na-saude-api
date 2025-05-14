const logEvent = require("../services/LogService");
const AdminService = require("../services/AdminService");

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
  getAppointmentsById: async (req, res) => {
    const { id } = req.params;
    try {
      const getAppointments = await AdminService.getAppointmentsById(id);

      const appointmentsWithLinks = getAppointments.map((appointment) => ({
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
    } catch (error) {}
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
        error: error.message, // Exibe a mensagem real do erro
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
          id: id,
        }),
        logEvent("Agendamento atualizado com sucesso!", body.user_id)
      );
    } catch (error) {
      logEvent("Erro ao atualizar agendamento:", error);
      return res.status(500).json({
        error: error.message, // Exibe a mensagem real do erro
      });
    }
  },
  searchAppointments: async (req, res) => {
    const { query } = req.query;  // Pega o valor da query string
    const userId = req.user?.id;
    
    if (!query) {
      return res.status(400).json({
        message: "Por favor, forneça um valor para a pesquisa."
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

      // Caso não encontre nenhum agendamento
      return res.status(404).json({
        message: "Nenhum agendamento encontrado.",
      });
    } catch (error) {
      // Retorna erro caso ocorra
      console.error("Erro ao buscar agendamentos:", error);
      return res.status(500).json({
        message: "Erro ao buscar os agendamentos.",
      });
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
      res.json({ message });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};

module.exports = AdminController;
