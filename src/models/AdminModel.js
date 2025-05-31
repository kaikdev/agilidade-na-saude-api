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

  findAppointmentsByAdminIdAndDate: async (
    adminId,
    serviceDate,
    excludeAppointmentId = null
  ) => {
    let sql = `SELECT * FROM create_service WHERE user_id = ? AND service_date = ?`;
    let params = [adminId, serviceDate];

    if (excludeAppointmentId !== null) {
      sql += ` AND id != ?`;
      params.push(excludeAppointmentId);
    }

    try {
      const result = await db.allAsync(sql, params);
      return result;
    } catch (err) {
      throw new Error(
        "Erro ao consultar agendamentos por admin_id e data: " + err.message
      );
    }
  },

  getAdminById: async (id) => {
    const sql = `
    SELECT * 
    FROM users AS u
    INNER JOIN admin_data AS cs ON u.id = cs.user_id
    WHERE cs.user_id = ?
  `;
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

  getAppointmentsById: async (id, userId) => {
    const sql = `SELECT * FROM create_service WHERE id = ? AND user_id = ?`;
    try {
      const result = await db.getAsync(sql, [id, userId]);

      return result;
    } catch (err) {
      throw new Error("Erro ao consultar o banco de dados: " + err.message);
    }
  },

  // No seu AdminModel
  updateAppointment: async (updateData, id) => {
    try {
      // Var partes dinâmicas da query
      const fields = [];
      const values = [];

      for (const key in updateData) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }

      if (fields.length === 0) {
        throw new Error("Nenhum campo foi enviado para atualizar.");
      }

      const query = `
      UPDATE create_service
      SET ${fields.join(", ")}
      WHERE id = ?
    `;

      values.push(id); // id vai por último nos parâmetros

      const result = await db.runAsync(query, values);

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
  deleteAppointmentById: async (id, userId) => {
    const sql = "DELETE FROM create_service WHERE id = ? AND user_id = ?";
    try {
      const result = await db.runAsync(sql, [id, userId]);
      return result;
    } catch (err) {
      throw new Error("Erro ao deletar agendamento: " + err.message);
    }
  },

  getScheduledAppointments: async (serviceIds) => {
    const placeholders = serviceIds.map(() => "?").join(", ");
    const sql = `
    SELECT 
      sc.id AS scheduled_id,
      sc.password,
      sc.priority,
      sc.finished,
      
      u.id AS user_id,
      u.name AS user_name,
      u.email,

      cs.id AS service_id,
      cs.specialty,
      cs.locality,
      cs.service_date

    FROM scheduled_consultations sc
    JOIN users u ON sc.user_id = u.id
    JOIN create_service cs ON sc.service_id = cs.id
    WHERE sc.service_id IN (${placeholders})
  `;

    try {
      const result = await db.allAsync(sql, serviceIds);
      return result;
    } catch (err) {
      throw new Error("Erro ao consultar o banco de dados: " + err.message);
    }
  },

  getScheduledAppointmentsByUserId: async (consultationId) => {
    const sql = `
    SELECT 
      sc.id AS consultation_id,
      sc.password,
      sc.priority,
      sc.finished,
      
      u.id AS user_id,
      u.name AS user_name,
      u.email,
      u.birth_date,

      cs.id AS service_id,
      cs.specialty,
      cs.locality,
      cs.service_date

    FROM scheduled_consultations sc
    JOIN users u ON sc.user_id = u.id
    JOIN create_service cs ON sc.service_id = cs.id
    WHERE sc.id = ?
  `;

    try {
      const result = await db.getAsync(sql, [consultationId]);
      if (!result) {
        throw new Error("Agendamento não encontrado.");
      }
      return result;
    } catch (err) {
      throw new Error("Erro ao consultar o banco de dados: " + err.message);
    }
  },

  finalizeScheduledAppointments: async (id) => {
    const sql = `UPDATE scheduled_consultations SET finished = 1 WHERE id = ?`;

    try {
      const result = await db.runAsync(sql, [id]);

      if (result.changes === 0) {
        throw new Error("Nenhum agendamento encontrado com esse ID.");
      }

      return { id, finished: 1 };
    } catch (err) {
      throw new Error(
        "Erro ao atualizar o status do agendamento: " + err.message
      );
    }
  },

  getTodayPasswords: async () => {
    try {
      const sql = `
        SELECT
          sc.password
        FROM scheduled_consultations sc
        JOIN create_service cs ON sc.service_id = cs.id
        WHERE DATE(cs.service_date) = DATE('now', 'localtime')
          AND sc.finished = 0
        ORDER BY sc.level ASC, sc.created_at ASC;
      `;
      const result = await db.allAsync(sql);
      return result;
    } catch (error) {
      throw new Error("Erro ao buscar fila no modelo: " + err.message);
    }
  },
  
  createdResumePatient: async (getAppointmentsByUserId) => {
    const sql = `INSERT INTO historical_consultation (data) VALUES (?)`;
    try {
      const snapshotJson = JSON.stringify(getAppointmentsByUserId);
      const result = await db.runAsync(sql, [snapshotJson]);
      return result;
    } catch (err) {
      throw new Error(`Erro ao criar histórico da consulta: ${err.message}`);
    }
  },
  deleteQueryAppointmentById: async (id) => {
    const sql = "DELETE FROM scheduled_consultations WHERE id = ?";
    try {
      const result = await db.runAsync(sql, [id]);
      return result;
    } catch (err) {
      throw new Error("Erro ao deletar agendamento: " + err.message);
    }
  }
};
module.exports = AdminModel;
