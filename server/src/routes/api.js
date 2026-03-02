const express = require("express");
const router = express.Router();
console.log("DEBUG: api.js loading controller...");
const { certifyStudent, n8nCallback, getStudentStatus, getAllStudents, testArkhiaConnection } = require("../controllers/certificationController");
console.log("DEBUG: api.js controller loaded.");

router.post("/certify", certifyStudent);
router.post("/webhook/n8n-callback", n8nCallback);
router.get("/student/:studentId/status", getStudentStatus);
router.get("/debug/students", getAllStudents);
router.get("/arkhia-check", testArkhiaConnection);

module.exports = router;
