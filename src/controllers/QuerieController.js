const QuerieService = require("../services/QuerieService");

const QuerieController = {
  getTodayPasswords: async (req, res) => {
    try {
      const data = await QuerieService.fetchTodayPasswords();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao buscar senhas da fila de hoje." + error.message,
      });
    }
  },
};

module.exports = QuerieController;
