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
  getAllPassowords: async (req, res, password) => {
    console.log(password);
    try {
      const passwords = await UserService.listAllPassword(password);
      res.json(passwords);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Erro ao buscar as senhas de atendimento." });
    }
  },
  createLisOfService: async (req, res) => {
    const serviceId = req.params.id;
    const { priority, level } = req.body;
    const userId = req.user?.id;

    if (!priority && !level) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios." });
    }

    try {
      const getAppointments = await UserService.getAppointmentsById(serviceId);
      const qtd = getAppointments.qtd_attendance;

      if (!getAppointments) {
        return res.status(404).json({ error: "Agendamento não encontrado." });
      }
      if (qtd > 0) {
        const waitingLinePassword =
          await UserRepository.createWaitingLinePassword();
        if (waitingLinePassword) {
          const data = {
            serviceId: serviceId,
            userId: userId,
            priority: priority,
            level: level,
            password: waitingLinePassword,
          };
          const insertPatientInQueue = await UserService.insertPatientInQueue(data);
          if (insertPatientInQueue.success) {
              let newQtd = qtd - 1;
              const updateQtdAttendence = await UserService.updateQtdAttendence(newQtd);
            return res.status(201).json({
              message: insertPatientInQueue.message,
              data: insertPatientInQueue.data,
            });
          } else {
            return res.status(400).json({ error: insertPatientInQueue.message });
          }


        }
      } else {
        return res
          .status(400)
          .json({ erro: "Não existe mais vagas para essa consulta" });
      }
    } catch (error) {
      console.error("Erro:", error.message);
      return res.status(500).json({ error: "Erro ao buscar agendamento." });
    }
  },
};

module.exports = UserController;
