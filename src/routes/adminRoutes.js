const express = require("express");
const AdminController = require("../controllers/AdminController");
const Auth = require("../config/auth");
const authorize = require("../middlewares/authorize");

const router = express.Router();

// Create User Admin/Doctor
router.post("/admin", AdminController.createAdmin);
router.get("/admin/appointments/:id", Auth.verifyToken, AdminController.getAppointments); 
router.post("/admin/appointments", Auth.verifyToken, AdminController.createAppointments); 
router.post("/admin/appointments/update/:id", Auth.verifyToken, AdminController.updateAppointments); 

module.exports = router;
