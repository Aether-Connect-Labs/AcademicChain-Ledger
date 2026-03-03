const express = require("express");
const router = express.Router();
const { certifyStudent, n8nCallback, getStudentStatus, getAllStudents, testArkhiaConnection, getDashboardMetrics } = require("../controllers/certificationController");
const { searchTalent, hireStudent, getMarketDemand } = require("../controllers/employerController");
const { getInstitutionReputation } = require("../controllers/institutionController");

router.post("/certify", certifyStudent);
router.post("/webhook/n8n-callback", n8nCallback);
router.get("/student/:studentId/status", getStudentStatus);
router.get("/debug/students", getAllStudents);
router.get("/arkhia-check", testArkhiaConnection);
router.get("/metrics/dashboard", getDashboardMetrics); // New Dashboard Metrics

// Employer & Market Routes
router.get("/talent/search", searchTalent); // ?query=React
router.post("/talent/hire", hireStudent); // { studentId, employerName, role }
router.get("/market/demand", getMarketDemand); // Analytics for institutions

// Institution Reputation (Dynamic Trust Badge)
router.get("/institution/:id/reputation", getInstitutionReputation);

module.exports = router;
