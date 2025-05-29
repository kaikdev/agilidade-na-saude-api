const db = require("../config/promisifiedDb");

const QuerieModel = {

  getTodayPasswords: async () => {
    console.log("Fetching today's passwords from the database...");
    try {
      const sql = `
        SELECT
          sc.password
        FROM scheduled_consultations sc
        JOIN create_service cs ON sc.service_id = cs.id
        WHERE DATE(cs.service_date)
          AND sc.finished = 0
        ORDER BY sc.level ASC, sc.created_at ASC;
      `;
      const result = await db.allAsync(sql);
      return result;
    } catch (error) {
      throw new Error("Erro ao buscar fila no modelo: " + err.message);
    }
  },
};
module.exports = QuerieModel;
