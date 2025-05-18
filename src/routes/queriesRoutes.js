const express = require("express");
const Auth = require("../config/auth");
const authorize = require("../middlewares/authorize");
const AdminController = require("../controllers/AdminController");

const router = express.Router();

// Create User Admin/Doctor

router.get("/frontDesk", AdminController.getTodayPasswords);//ok

module.exports = router;
