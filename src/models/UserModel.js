const db = require("../config/promisifiedDb");

const UserModel = {
  // Criar um novo usuário
  create: async (name, email, password, role, birth_date) => {
    const sql = `INSERT INTO users (name, email, password, role, birth_date) VALUES (?, ?, ?, ?, ?)`;
    try {
      const result = await db.runAsync(sql, [
        name,
        email,
        password,
        role,
        birth_date,
      ]);
      if (!result || !result.lastID) {
        throw new Error("Não foi possível obter o ID do usuário criado");
      }
      return result.lastID;
    } catch (err) {
      console.error("Erro no UserModel.create:", {
        error: err,
        query: sql,
        params: [name, email, "***", role, birth_date],
      });
      throw err;
    }
  },

  // Buscar usuário pelo e-mail
  findByEmail: async (email) => {
    const sql = `SELECT * FROM users WHERE email = ?`;
    const user = await db.getAsync(sql, [email]);
    return user;
  },

  // Buscar usuário pelo ID
  findById: async (id) => {
    const sql = `SELECT id, name, email, birth_date FROM users WHERE id = ?`;
    const user = await db.getAsync(sql, [id]);
    return user;
  },

  // Atualizar dados do usuário
  update: async (id, name, email) => {
    const sql = `UPDATE users SET name = ?, email = ? WHERE id = ?`;
    const result = await db.runAsync(sql, [name, email, id]);
    return result.changes;
  },

  updatePassword: async (id, newPassword) => {
    const sql = `UPDATE users SET password = ? WHERE id = ?`;
    const result = await db.runAsync(sql, [newPassword, id]);
    return result.changes;
  },

  // Excluir um usuário
  delete: async (id) => {
    const sql = `DELETE FROM users WHERE id = ?`;
    const result = await db.runAsync(sql, [id]);
    return result.changes;
  },

  // Listar todos os usuários
  findAll: async () => {
    const sql = `SELECT * FROM users`;
    const users = await db.allAsync(sql);
    return users;
  },
  getAllAppointments: async () => {
    const sql = `
            SELECT 
                cs.*,  -- Seleciona todas as colunas da tabela create_service
                u.name AS provider_name,
                ad.specialty AS provider_specialty, -- Especialidade DO PROFISSIONAL
                ad.crm AS provider_crm,
                ad.presentation AS provider_presentation
            FROM 
                create_service cs
            LEFT JOIN 
                users u ON cs.user_id = u.id
            LEFT JOIN 
                admin_data ad ON cs.user_id = ad.user_id
            -- Adicione ORDER BY se desejar, por exemplo:
            -- ORDER BY cs.created_at DESC; 
        `;
    try {
      const data = await db.allAsync(sql);
      return data;
    } catch (err) {
      console.error("Erro no Model - getAllAppointments:", err.message);
      throw new Error(
        "Erro ao buscar todos os atendimentos disponíveis no banco de dados: " +
          err.message
      );
    }
  },
  listAllPassword: async (password) => {
    const sql =
      "SELECT password FROM scheduled_consultations WHERE password = ?";
    try {
      const result = await db.allAsync(sql, [password]); // Passa o parâmetro corretamente
      return result;
    } catch (err) {
      throw new Error("Erro ao consultar senhas: " + err.message);
    }
  },
  getAllAppointmentsById: async (id) => {
    const sql = "SELECT * FROM create_service WHERE id = ?";
    try {
      const result = await db.getAsync(sql, [id]);
      return result;
    } catch (err) {
      throw new Error("Erro ao consultar o banco de dados: " + err.message);
    }
  },
  checkPatientInQueue: async (serviceId, userId) => {
    const sql = `
        SELECT * 
        FROM scheduled_consultations 
        WHERE service_id = ? AND user_id = ?
        LIMIT 1
    `;
    const result = await db.getAsync(sql, [serviceId, userId]);
    return !!result; // Retorna true se existir, false se não
  },

  insertPatientInQueue: async (data) => {
    const sql = `
        INSERT INTO scheduled_consultations 
        ( user_id, service_id, password, priority, level ) 
        VALUES (?, ?, ?, ?, ?)
      `;

    const params = [
      data.userId,
      data.serviceId,
      data.password,
      data.priority,
      data.level,
    ];
    return db.runAsync(sql, params);
  },

  updateQtdAttendance: async (newQtd, serviceId) => {
    const sql = `UPDATE create_service SET qtd_attendance = ? WHERE id = ?`;
    const result = await db.runAsync(sql, [newQtd, serviceId]);
    return result;
  },

  getAppointmentsByUserId: async (id, userId, role) => {
    let sql = `
    SELECT 
      u.id,
      u.name AS user_name,
  `;

    if (role === "admin") {
      sql += `u.email, `;
    }

    sql += `
      sc.id AS consultation_id,
      sc.password,
      sc.priority,
      cs.id AS service_id,
      cs.specialty AS service_specialty,
      cs.locality,
      cs.service_date
  `;

    if (role === "user") {
      sql += `,
      ad.crm AS provider_crm,
      ad.specialty AS admin_specialty,
      ad.presentation
    `;
    }

    sql += `
    FROM scheduled_consultations sc
    LEFT JOIN create_service cs ON sc.service_id = cs.id
  `;

    if (role === "admin") {
      sql += `LEFT JOIN users u ON sc.user_id = u.id `;
    } else {
      sql += `LEFT JOIN users u ON cs.user_id = u.id `;
    }

    if (role === "user") {
      sql += `LEFT JOIN admin_data ad ON ad.user_id = cs.user_id `;
    }

    if (role === "admin") {
      sql += `WHERE cs.user_id = ? AND sc.id = ? `;
    } else {
      sql += `WHERE sc.user_id = ? `;
    }

    sql += `ORDER BY sc.created_at DESC `;

    try {
      const params = role === "admin" ? [userId, id] : [userId];
      const result = await db.allAsync(sql, params);

      return result.length === 0 ? [] : result;
    } catch (err) {
      throw new Error(err.message);
    }
  },
  getAdminBydIds:async (service_Ids) => {

  }  ,
  getResumeAppointments: async (userId) => {
    const sql = `
    SELECT hc.*
    FROM historical_consultation hc,
         json_each(hc.data)
    WHERE json_each.value ->> '$.id' = ?;
  `;

    const rows = await db.allAsync(sql, [userId]); // Executando a consulta

    if (!rows || rows.length === 0) {
      throw new Error("Nenhum resumo de agendamentos encontrado.");
    }

    rows.forEach((row) => {
      try {
        row.data = JSON.parse(row.data); // convertendo o campo data para objetos JSON, caso seja necessário
      } catch (err) {
        throw new Error("Erro ao converter o campo data para JSON: " + err.message);
      }
    });

    return rows;
  },
};

module.exports = UserModel;
