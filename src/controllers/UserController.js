const UserService = require("../services/UserService");
const logEvent = require("../services/LogService");

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
      const userId = await UserService.createUser(name, email, password, role, birth_date);
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
};

module.exports = UserController;
