const asyncHandler = require('express-async-handler');
const Credential = require('../models/credentialModel');

// @desc    Get student credentials
// @route   GET /api/credentials/mine
// @access  Private (Student)
const getStudentCredentials = asyncHandler(async (req, res) => {
  const credentials = await Credential.find({ student: req.user._id });
  res.status(200).json({ credentials });
});

module.exports = { getStudentCredentials };