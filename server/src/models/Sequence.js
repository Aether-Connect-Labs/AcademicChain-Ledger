const mongoose = require('mongoose');

const SequenceSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 }
});

SequenceSchema.statics.getNext = async function(key) {
  const sequence = await this.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return sequence.value;
};

module.exports = mongoose.model('Sequence', SequenceSchema);
