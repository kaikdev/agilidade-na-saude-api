const DisplayService = require("../services/DisplayService");

const DisplayController = {
    getQueueDisplay: async (req, res) => {
        const { uuid } = req.params;
        try {
            const displayData = await DisplayService.getDisplayData(uuid);
            res.json(displayData);
        } catch (err) {
            res.status(404).json({ error: err.message });
        }
    },
};

module.exports = DisplayController;