const QuerieModel = require("../models/QuerieModel");

const QuerieService = {
  fetchTodayPasswords: async () => {
    try {
      const passwords = await QuerieModel.getTodayPasswords();
      return passwords;
    } catch (err) {
      throw new Error("Erro no serviço ao buscar senhas:" + err.message);
    }
  },
};
module.exports = QuerieService;
