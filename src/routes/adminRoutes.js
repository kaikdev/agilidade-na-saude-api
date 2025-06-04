const express = require("express");
const AdminController = require("../controllers/AdminController");
const Auth = require("../config/auth");
const authorize = require("../middlewares/authorize");

const router = express.Router();

// Create User Admin/Doctor

router.post("/admin", AdminController.createAdmin);//ok
router.get("/admin/:id",  Auth.verifyToken, authorize(["admin"]), AdminController.getAdmById);//ok
router.put("/admin/update/:id",  Auth.verifyToken, authorize(["admin"]), AdminController.updateAdmin);//ok
router.delete("/admin/delete/:id", Auth.verifyToken, authorize(["admin"]), AdminController.delete);//ok

router.get("/admin/appointments/listAll", Auth.verifyToken, authorize(["admin"]), AdminController.getAllAppointments); //ok
router.get("/admin/appointments/:id", Auth.verifyToken, authorize(["admin"]), AdminController.getAppointmentsById); //ok
router.post("/admin/appointments", Auth.verifyToken, authorize(["admin"]), AdminController.createAppointments); //ok
router.get('/admin/appointments/search', Auth.verifyToken, authorize(["admin"]), AdminController.searchAppointments);//ok
router.put("/admin/appointments/update/:id", Auth.verifyToken, authorize(["admin"]), AdminController.updateAppointments); 
router.delete("/admin/appointments/delete/:id", Auth.verifyToken, authorize(["admin"]), AdminController.deleteAppointments);//ok

router.get("/admin/scheduled/Appointments", Auth.verifyToken, authorize(["admin"]), AdminController.getScheduledAppointments); //ok
router.get("/admin/scheduled/appointments/:id", Auth.verifyToken, authorize(["admin"]), AdminController.getScheduledAppointmentsById); //ok
router.put("/admin/scheduled/appointments/finalize/:id", Auth.verifyToken, authorize(["admin"]), AdminController.finalizeScheduledAppointments); //ok

router.get("/admin/scheduled/getMyQueries", Auth.verifyToken, authorize(["admin"]), AdminController.getQueriesMyPatient); //ok

router.put("/admin/appointments/prioritizePatient/:id", Auth.verifyToken, authorize(["admin"]), AdminController.prioritizePatientInQuerie); //ok


module.exports = router;
