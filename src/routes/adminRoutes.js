const express = require("express");
const AdminController = require("../controllers/AdminController");
const Auth = require("../config/auth");
const authorize = require("../middlewares/authorize");

const router = express.Router();

// Create User Admin/Doctor

router.post("/admin", AdminController.createAdmin);//ok
router.get("/admin/:id",  Auth.verifyToken, authorize(["admin"]), AdminController.getAdmById);//ok
router.post("/admin/update/:id",  Auth.verifyToken, authorize(["admin"]), AdminController.updateAdmin);//ok
router.delete("/admin/delete/:id", Auth.verifyToken, authorize(["admin"]), AdminController.delete);//ok

router.get("/admin/appointments/:id", Auth.verifyToken, authorize(["admin"]), AdminController.getAppointmentsById); //ok
router.post("/admin/appointments", Auth.verifyToken, authorize(["admin"]), AdminController.createAppointments); //ok
router.get('/appointments/search', Auth.verifyToken, authorize(["admin"]), AdminController.searchAppointments);//ok
router.put("/admin/appointments/update/:id", Auth.verifyToken, authorize(["admin"]), AdminController.updateAppointments); 
router.delete("/admin/appointments/delete/:id", Auth.verifyToken, authorize(["admin"]), AdminController.deleteAppointments);//ok

module.exports = router;
