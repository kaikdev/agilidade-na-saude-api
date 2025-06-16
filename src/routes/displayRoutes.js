const express = require("express");
const DisplayController = require("../controllers/DisplayController");

const router = express.Router();

router.get("/display/:uuid", DisplayController.getQueueDisplay);

module.exports = router;