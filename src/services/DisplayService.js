const DisplayModel = require("../models/DisplayModel");

const DisplayService = {
    getDisplayData: async (uuid) => {
        const queueData = await DisplayModel.getQueueByUuid(uuid);

        if (!queueData || queueData.length === 0) {
            throw new Error("Atendimento não encontrado ou fila vazia.");
        }

        const called = queueData.filter(p => p.finished === 1);
        const waiting = queueData.filter(p => p.finished === 0);

        called.sort((a, b) => new Date(b.finished_at) - new Date(a.finished_at));

        waiting.sort((a, b) => a.level - b.level || new Date(a.created_at) - new Date(b.created_at));

        return {
            service_specialty: queueData[0].specialty,
            current: waiting.length > 0 ? {
                password: waiting[0].password,
                patient_name: waiting[0].user_name
            } : null,
            last_called: called.slice(0, 3).map(p => ({
                password: p.password,
                patient_name: p.user_name
            }))
        };
    }
};

module.exports = DisplayService;