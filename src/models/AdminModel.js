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
      "SELECT * FROM create_service WHERE id = ? AND service_date = ?";
    try {
      const result = await db.getAsync(sql, [id, date]);
      return result ? [result] : [];
    } catch (err) {
      throw new Error("Erro ao consultar o banco de dados: " + err.message);
    }
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
  getAppointmentsById: async (id) => {
    const sql = "SELECT * FROM create_service WHERE user_id = ?";
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
        id
      ];
      
      // Correção: usar runAsync (com 'r' minúsculo) em vez de runAsync
      const result = await db.runAsync(query, params);
      
      if (result.changes === 0) {
        throw new Error("Nenhum registro foi atualizado. Verifique o ID fornecido.");
      }
      
      return result;
    } catch (err) {
      throw new Error("Erro ao atualizar no banco de dados: " + err.message);
    }
},
};
module.exports = AdminModel;
