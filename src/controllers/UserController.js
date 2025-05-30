

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
    const id = parseInt(req.params.id);
    const userId = req.user?.id;

    if(id !== userId){ 
      return res.status(403).json({ error: "Acesso negado." });
    }
    try {
      const user = await UserService.getUserById(id, userId);

      const output = {
        ...user,
        link: {
          update: `http://localhost:3000/api/users/update/${user.id}`,
          delete: `http://localhost:3000/api/users/delete/${user.id}`,
        }
      }

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
    
    if(id !== userId){ 
      return res.status(403).json({ error: "Acesso negado." });
    }

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

    if(id !== userId){ 
      return res.status(403).json({ error: "Acesso negado." });
    }

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
      const getPriorites = UserRepository.priorates();

      if (getAppointments.length > 0) {
        const appointmentsWithLinks = getAppointments.map((appointment) => ({
          ...appointment,
          data: {
            create: `http://localhost:3000/api/users/appointments/createService/${appointment.id}`,
          },
        }));
        return res.status(200).json({
          message: "Consultas encontradas!",
          appointments: appointmentsWithLinks,
          priorites: getPriorites,
        });
      } else {
        return res.status(200).json({ // Status 200 OK é apropriado para "sucesso, mas lista vazia"
          message: "Nenhuma consulta disponível no momento.",
          appointments: [], // Retorne um array vazio
          priorites: getPriorites,
        });
      }
    } catch (err) {
      console.error("Erro ao buscar agendamentos para lista de usuário:", err); // Adicionei um log para depuração
      return res.status(500).json({ error: "Erro ao buscar atendimentos." });
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
      if (qtd > 0) { //essa lógica talvez não precise, pode excluir o if, se atrapalhar, apanas tire se não bloquear lá no front 
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
  appointmentsScheduled: async (req, res) => {
    const userId = req.user?.id;//usuario logado

    try {
      const getAllAppointments = await UserService.appointmentsScheduled(userId);//pega os agendamentos do usuario logado
        return res.status(200).json({
          message: "Agendamentos encontrados!",
          appointments: getAllAppointments,
        });
     
    } catch (err) {
      console.error("Erro:", err.message);
      return res.status(500).json({ error: "Erro ao buscar agendamentos."  });
      
    }
  }
};

module.exports = UserController;