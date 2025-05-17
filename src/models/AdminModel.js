const db = require("../config/promisifiedDb");

const AdminModel = {
  createAdminData: async (userId, crm, specialty, presentation) => {
    const sql = `INSERT INTO admin_data (user_id, crm, specialty, presentation) VALUES (?, ?, ?, ?)`;
    try {
      await db.runAsync(sql, [userId, crm, specialty, presentation]);
    } catch (err) {
      throw new Error(`Erro ao criar dados do admin: ${err.message}`);
    }
  },

  getAppointmentsByIdAndDate: async (id, date) => {
    const sql =
      "SELECT * FROM create_service WHERE user_id = ? AND service_date = ?";
    try {
      const result = await db.allAsync(sql, [id, date]);
      return result;
    } catch (err) {
      throw new Error("Erro ao consultar o banco de dados: " + err.message);
    }
  },

  getAdminById: async (id) => {
    const sql = `SELECT * FROM users where id = ?`;
    const result = await db.allAsync(sql, [id]);
    // Se não houver nenhum usuário no banco de dados (array vazio), lança um erro
    if (result.length === 0) {
      throw new Error("Usuário não encontrado.");
    }

    return result;
  },

  createAppointment: async (appointmentData) => {
    const sql =
      "INSERT INTO create_service (user_id, specialty, locality, qtd_attendance, service_date) VALUES (?, ?, ?, ?, ?)";
    try {
      const result = await db.runAsync(sql, [
        appointmentData.user_id,
        appointmentData.specialty,
        appointmentData.locality,
        appointmentData.qtd_attendance,
        appointmentData.service_date,
      ]);
      return result;
    } catch (err) {
      throw new Error("Erro ao criar agendamento: " + err.message);
    }
  },

  findAllAppointments: async (id) => {
    const sql = `SELECT * FROM create_service WHERE user_id = ?`;
    const users = await db.allAsync(sql, [id]);
    return users;
  },

  getAppointmentsById: async (id) => {
    const sql = "SELECT * FROM create_service WHERE id = ?";
    try {
      const result = await db.allAsync(sql, [id]);
      return result;
    } catch (err) {
      throw new Error("Erro ao consultar o banco de dados: " + err.message);
    }
  },

  // No seu AdminModel
  updateAppointment: async (updateData, id) => {
    const query = `
      UPDATE create_service
      SET 
          specialty = ?,
          locality = ?,
          qtd_attendance = ?,
          service_date = ?
      WHERE 
          id = ?
    `;

    try {
      const params = [
        updateData.specialty,
        updateData.locality,
        updateData.qtd_attendance,
        updateData.service_date,
        id,
      ];

      // Correção: usar runAsync (com 'r' minúsculo) em vez de runAsync
      const result = await db.runAsync(query, params);

      if (result.changes === 0) {
        throw new Error(
          "Nenhum registro foi atualizado. Verifique o ID fornecido."
        );
      }

      return result;
    } catch (err) {
      throw new Error("Erro ao atualizar no banco de dados: " + err.message);
    }
  },

  searchAppointments: async (query) => {
    const sql = `
      SELECT * 
      FROM create_service 
      WHERE specialty LIKE ? 
      OR locality LIKE ? 
    `;

    const searchTerm = `%${query}%`;

    try {
      const results = await db.allAsync(sql, [searchTerm, searchTerm]);
      return results;
    } catch (error) {
      throw new Error("Erro ao consultar o banco de dados: " + error.message);
    }
  },

  deleteAdminById: async (id) => {
    const sql = "DELETE FROM users WHERE id = ?";
    try {
      const result = await db.runAsync(sql, [id]);
      return result;
    } catch (err) {
      throw new Error("Erro ao deletar agendamento: " + err.message);
    }
  },

  // AdminModel.js
  deleteAppointmentById: async (id) => {
    const sql = "DELETE FROM create_service WHERE id = ?";
    try {
      const result = await db.runAsync(sql, [id]);
      return result;
    } catch (err) {
      throw new Error("Erro ao deletar agendamento: " + err.message);
    }
  },

  getScheduledAppointments: async (serviceIds) => {

    const placeholders = serviceIds.map(() => "?").join(", ");
    const sql = `
    SELECT * 
    FROM scheduled_consultations 
    WHERE service_id IN (${placeholders}) 
  `;

    try {
      const result = await db.allAsync(sql, serviceIds);
      return result;
    } catch (err) {
      throw new Error("Erro ao consultar o banco de dados: " + err.message);
    }
  },
};
module.exports = AdminModel;
