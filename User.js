const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['university', 'admin', 'employer'],
    required: true,
  },
  universityName: {
    type: String,
    // Solo es requerido si el rol es 'university'
    required: function() { return this.role === 'university'; }
  },
  hederaAccountId: { type: String, default: null },
  did: { type: String, default: null, unique: true, sparse: true }, // Identificador Descentralizado
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Indexar campos para búsquedas más rápidas
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// No devolver la contraseña en las consultas por defecto
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);