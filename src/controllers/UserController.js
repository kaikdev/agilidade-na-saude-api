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
    const serviceId = req.params.id;//id na requisição 
    const { priority, level } = req.body;// corpo do body, form
    const userId = req.user?.id;//usuario logado

    if (!priority && !level) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios." });
    }

    try {
      const getAppointments = await UserService.getAppointmentsById(serviceId);//pega o serviço por id 
      const qtd = getAppointments.qtd_attendance;//separa a qtd_attendance-> quantidade de atenmdimento que o medico vai fazer 

      if (!getAppointments) {
        return res.status(404).json({ error: "Agendamento não encontrado." });
      }
      if (qtd > 0) { //essa lógica talvez não precise, pode excluir o if, se atrapalhar 
        const waitingLinePassword = await UserRepository.createWaitingLinePassword();//criação da senha do usario
        if (waitingLinePassword) {
          const data = {
            serviceId: serviceId,
            userId: userId,
            priority: priority,
            level: level,
            password: waitingLinePassword,
          };
          const insertPatientInQueue = await UserService.insertPatientInQueue(data);//insere na tabela o id da consulta e o id do usuario logado
          if (insertPatientInQueue.success) {
              let newQtd = qtd - 1;//pega a quantidade atual do qtd_attendece subtrai 1 e atualiza a consulta médica
              const updateQtdAttendance = await UserService.updateQtdAttendance(newQtd, serviceId );//update na consulta create service
            return res.status(201).json({
              data: insertPatientInQueue,
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
