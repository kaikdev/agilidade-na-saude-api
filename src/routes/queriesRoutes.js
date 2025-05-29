const express = require("express");
const QuerieController = require("../controllers/QuerieController");

const router = express.Router();

router.get("/Querie", QuerieController.getTodayPasswords);//ok

module.exports = router;
