const express = require("express");
const router = express.Router();
const { certifyStudent, n8nCallback, getStudentStatus, getAllStudents, testArkhiaConnection } = require("../controllers/certificationController");
const { searchTalent, hireStudent, getMarketDemand } = require("../controllers/employerController");

router.post("/certify", certifyStudent);
router.post("/webhook/n8n-callback", n8nCallback);
router.get("/student/:studentId/status", getStudentStatus);
router.get("/debug/students", getAllStudents);
router.get("/arkhia-check", testArkhiaConnection);

// Employer & Market Routes
router.get("/talent/search", searchTalent); // ?query=React
router.post("/talent/hire", hireStudent); // { studentId, employerName, role }
router.get("/market/demand", getMarketDemand); // Analytics for institutions

module.exports = router;
