const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getStudentCredentials } = require('../controllers/studentController');

router.get('/mine', protect, getStudentCredentials);

module.exports = router;