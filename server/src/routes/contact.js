const express = require('express');
const asyncHandler = require('express-async-handler');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const logger = require('../utils/logger');

const router = express.Router();

router.post('/book',
  [
    body('name').notEmpty().isString().trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('org').notEmpty().isString().trim().escape(),
    body('date').notEmpty().isString().trim(),
    body('time').notEmpty().isString().trim(),
    body('tz').notEmpty().isString().trim(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { Booking } = require('../models');
    const { name, email, org, date, time, tz } = req.body;
    try {
      const record = await Booking.create({ name, email, org, date, time, tz, status: 'requested' });
      logger.info(`📅 Nueva reserva: ${date} ${time} (${tz}) de ${name} - ${org} <${email}>`);
      res.status(201).json({ success: true, message: 'Reserva recibida', data: { id: record.id } });
    } catch (e) {
      res.status(500).json({ success: false, message: 'No se pudo registrar la reserva' });
    }
  })
);

module.exports = router;
