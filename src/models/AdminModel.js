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

  // Atualizar Admin em ambas as tabelas (users e admin_data)
  update: async (id, updateData) => {
    const userFields = {};
    const adminDataFields = {};
    const userTableKeys = ['name', 'email', 'cpf', 'password', 'profile_image_path'];
    const adminTableKeys = ['crm', 'specialty', 'presentation'];

    Object.keys(updateData).forEach(key => {
      if (userTableKeys.includes(key)) {
        userFields[key] = updateData[key];
      } else if (adminTableKeys.includes(key)) {
        adminDataFields[key] = updateData[key];
      }
    });

    if (Object.keys(userFields).length === 0 && Object.keys(adminDataFields).length === 0) {
      return 0;
    }

    try {
      await db.runAsync("BEGIN TRANSACTION;");

      let changes = 0;

      if (Object.keys(userFields).length > 0) {
        const setUserClause = Object.keys(userFields).map(f => `${f} = ?`).join(', ');
        const userValues = Object.values(userFields);
        const userSql = `UPDATE users SET ${setUserClause} WHERE id = ?`;
        const userResult = await db.runAsync(userSql, [...userValues, id]);
        changes += userResult.changes;
      }

      if (Object.keys(adminDataFields).length > 0) {
        const setAdminClause = Object.keys(adminDataFields).map(f => `${f} = ?`).join(', ');
        const adminValues = Object.values(adminDataFields);
        const adminSql = `UPDATE admin_data SET ${setAdminClause} WHERE user_id = ?`;
        const adminResult = await db.runAsync(adminSql, [...adminValues, id]);
        changes += adminResult.changes;
      }

      await db.runAsync("COMMIT;");
      return changes;
    }
    catch (err) {
      await db.runAsync("ROLLBACK;");
      throw new Error(`Erro ao atualizar dados do administrador: ${err.message}`);
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

  // Deletar um administrador pelo ID
  deleteById: async (id) => {
    try {
      await db.runAsync("BEGIN TRANSACTION;");

      await db.runAsync(`DELETE FROM admin_data WHERE user_id = ?`, [id]);

      const result = await db.runAsync(`DELETE FROM users WHERE id = ?`, [id]);

      await db.runAsync("COMMIT;");

      return result.changes;
    }
    catch (err) {
      await db.runAsync("ROLLBACK;");
      console.error("Erro na transação de exclusão do admin:", err);
      throw new Error("Erro ao deletar administrador do banco de dados.");
    }
  },

  createAppointment: async (appointmentData) => {
    const sql =
      "INSERT INTO create_service (user_id, specialty, locality, qtd_attendance, service_date, display_uuid) VALUES (?, ?, ?, ?, ?, ?)";
    try {
      const result = await db.runAsync(sql, [
        appointmentData.user_id,
        appointmentData.specialty,
        appointmentData.locality,
        appointmentData.qtd_attendance,
        appointmentData.service_date,
        appointmentData.display_uuid,
      ]);
      return result;
    } catch (err) {
      throw new Error("Erro ao criar agendamento: " + err.message);
    }
  },

  findAllAppointments: async (id) => {
    const sql = `
            SELECT 
                cs.*
            FROM 
                create_service cs
            WHERE 
                cs.user_id = ? AND
                NOT EXISTS (
                    SELECT 1
                    FROM historical_consultation hc
                    WHERE json_extract(hc.data, '$.serviceId') = CAST(cs.id AS TEXT)
                )
            ORDER BY
                cs.service_date ASC
        `;
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
      u.cpf,

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
      u.cpf,
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
    const sql = `UPDATE scheduled_consultations SET finished = 1, finished_at = datetime('now', 'localtime') WHERE id = ?`;

    try {
      const result = await db.runAsync(sql, [id]);
      return result;
    }
    catch (err) {
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
  },

  getQueriesMyPatient: async (userId, serviceId) => {
    try {
      const sql = `
            SELECT
                sc.id AS scheduled_id,
                sc.service_id,
                sc.password,
                sc.priority,
                sc.level as level,
                u.id AS user_id,
                u.name AS user_name,
                cs.specialty
            FROM scheduled_consultations sc
            JOIN users u ON sc.user_id = u.id
            JOIN create_service cs ON sc.service_id = cs.id
            WHERE 
                cs.user_id = ? 
                AND sc.service_id = ? 
                AND sc.finished = 0 -- ADICIONADO: Filtra para mostrar apenas pacientes não finalizados
            ORDER BY 
                sc.level ASC, sc.created_at ASC;
        `;
      const result = await db.allAsync(sql, [userId, serviceId]);
      return result;
    } catch (error) {
      throw new Error("Erro ao buscar consultas no modelo: " + error.message);
    }
  },

  prioritizePatientInQuerie: async (id) => {
    //const sql = `UPDATE scheduled_consultations SET level = -1 WHERE id = ?`;
    console.log("alterando")
    const sql = `UPDATE scheduled_consultations SET level = -1 WHERE scheduled_consultations.id = ?`;
    try {
      const result = await db.runAsync(sql, [id]);
      return result;
    } catch (err) {
      throw new Error("Erro ao priorizar paciente: " + err.message);
    }
  },

  getServicesWithActiveQueues: async (adminId) => {
    const sql = `
        SELECT DISTINCT
            cs.id AS service_id,
            cs.specialty,
            cs.locality,
            cs.service_date
        FROM 
            create_service cs
        INNER JOIN 
            scheduled_consultations sc ON cs.id = sc.service_id
        WHERE 
            cs.user_id = ?
            AND cs.service_date > datetime('now', 'localtime')
        ORDER BY
            cs.service_date ASC;
    `;
    try {
      const data = await db.allAsync(sql, [adminId]);
      return data;
    } catch (err) {
      console.error("Erro no Model - getServicesWithActiveQueues:", err.message);
      throw new Error("Erro ao buscar serviços com filas ativas no banco de dados.");
    }
  },

  getAttendedPatientsByServiceId: async (serviceId, adminId) => {
    const sql = `
        SELECT sc.*, u.name as user_name, u.cpf
        FROM scheduled_consultations sc
        JOIN users u ON sc.user_id = u.id
        JOIN create_service cs ON sc.service_id = cs.id
        WHERE sc.service_id = ? AND cs.user_id = ? AND sc.finished = 1
    `;
    try {
      return await db.allAsync(sql, [serviceId, adminId]);
    } catch (err) {
      throw new Error("Erro ao buscar pacientes atendidos: " + err.message);
    }
  },

  deleteAttendedFromQueue: async (serviceId) => {
    const sql = "DELETE FROM scheduled_consultations WHERE service_id = ? AND finished = 1";
    try {
      return await db.runAsync(sql, [serviceId]);
    } catch (err) {
      throw new Error("Erro ao limpar fila de atendidos: " + err.message);
    }
  },

  getAllHistory: async () => {
    const sql = `SELECT * FROM historical_consultation ORDER BY id DESC`;
    try {
      const data = await db.allAsync(sql);
      return data;
    } catch (err) {
      throw new Error("Erro ao buscar dados do histórico no banco de dados.");
    }
  },

};
module.exports = AdminModel;
