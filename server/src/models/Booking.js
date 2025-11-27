const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  org: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  tz: { type: String, required: true },
  status: { type: String, default: 'requested' },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
