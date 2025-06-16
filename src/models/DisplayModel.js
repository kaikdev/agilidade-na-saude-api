const db = require("../config/promisifiedDb");

const DisplayModel = {
    getQueueByUuid: async (uuid) => {
        const sql = `
            SELECT 
                sc.*,
                u.name AS user_name,
                cs.specialty
            FROM scheduled_consultations sc
            JOIN create_service cs ON sc.service_id = cs.id
            JOIN users u ON sc.user_id = u.id
            WHERE cs.display_uuid = ?
        `;
        try {
            return await db.allAsync(sql, [uuid]);
        } catch (err) {
            throw new Error("Erro ao buscar dados da fila por UUID.");
        }
    }
};

module.exports = DisplayModel;