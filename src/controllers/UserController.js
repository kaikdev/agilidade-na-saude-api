const UserService = require("../services/UserService");
const logEvent = require("../services/LogService");
const UserRepository = require("../repository/UserRepository");

const UserController = {
  // Criar novo usuário
  createUser: async (req, res) => {
    const { name, email, password, role, birth_date } = req.body;

    if (!name || !email || !password || !role || !birth_date) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios." });
    }

    try {
      const userId = await UserService.createUser(
        name,
        email,
        password,
        role,
        birth_date
      );
      logEvent(`Conta criada - Usuário ID: ${userId}`);
      res.status(201).json({ message: "Usuário criado com sucesso!", userId });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Obter detalhes do usuário pelo ID
  getUserById: async (req, res) => {
    const { id } = req.params;

    try {
      const user = await UserService.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Atualizar usuário
  updateUser: async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Nome e e-mail são obrigatórios." });
    }

    try {
      const message = await UserService.updateUser(id, name, email);
      res.json({ message });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Excluir usuário
  deleteUser: async (req, res) => {
    const { id } = req.params;

    try {
      const message = await UserService.deleteUser(id);
      logEvent(`Conta excluída - Usuário ID: ${id}`);
      res.json({ message });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Listar todos os usuários
  listUsers: async (req, res) => {
    try {
      const users = await UserService.listUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar usuários." });
    }
  },

  appointmentsList: async (req, res) => {
    try {
      const getAppointments = await UserService.appointmentsList();

      const getPriorites = UserRepository.priorates(); //
      if (getAppointments.length > 0) {
        const appointmentsWithLinks = getAppointments.map((appointment) => ({
          ...appointment,
          data: {
            create: `http://localhost:3000/api/users/appointments/createService/${appointment.id}`, // só pode criar se ainda tiver quantidade, fazer essa logica no front
          },
        }));
        return res.status(200).json({
          message: "Consultas encontradas!",
          appointments: appointmentsWithLinks, //exiba appointments, envie por form, exiba os serviços direto no form
          priorites: getPriorites, //ao clicar no link acima abre uma modal perguntando a prioridade,
        });
      }
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar usuários." });
    }
  },

  createLisOfService: async (req, res) => {
    const id_appointments = req.params;
    const { priorites, nivel } = req.body;
    const userId = req.user?.id;

    if (!priorites && !nivel && !userId ) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios." });
    }
    try {
      const getAllAppointmentsById = await UserService.getAllAppointmentsById(id_appointments);
    } catch (error) {
      
    }
  },
};

module.exports = UserController;
