const express = require("express");
const AdminController = require("../controllers/AdminController");
const Auth = require("../config/auth");
const authorize = require("../middlewares/authorize");

const router = express.Router();

// Create User Admin/Doctor

router.post("/admin", AdminController.createAdmin);//ok
router.get("/admin/:id", AdminController.getAdmById);//ok
router.post("/admin/listAll", AdminController.createAdmin);//ok
router.post("/admin/update/:id", AdminController.updateAdmin);//ok
router.delete("/admin/delete/:id", AdminController.delete);//ok

router.get("/admin/appointments/:id", Auth.verifyToken, AdminController.getAppointmentsById); //ok
router.post("/admin/appointments", Auth.verifyToken, AdminController.createAppointments); //ok
router.get('/appointments/search', Auth.verifyToken, AdminController.searchAppointments);//ok
router.put("/admin/appointments/update/:id", Auth.verifyToken, AdminController.updateAppointments); 
router.delete("/admin/appointments/delete/:id", Auth.verifyToken, AdminController.deleteAppointments);//ok

module.exports = router;
