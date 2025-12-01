const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * @swagger
 * components:
 *   schemas:
 *     Partner:
 *       type: object
 *       required:
 *         - name
 *         - contactEmail
 *       properties:
 *         name:
 *           type: string
 *           description: "Nombre del partner (ej. LinkedIn, Indeed)."
 *         contactEmail:
 *           type: string
 *           format: email
 *           description: "Email de contacto del partner."
 *         keyPrefix:
 *           type: string
 *           description: "Prefijo único y público de la API key (ej. acp_linkedin_...)."
 *           unique: true
 *         keyHash:
 *           type: string
 *           description: "Hash de la API key secreta."
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: "Indica si la API key del partner está activa."
 *         permissions:
 *           type: [String]
 *           description: "Permisos asignados al partner (ej. 'verify_credential')."
 */
const PartnerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactEmail: { type: String, required: false, unique: true, sparse: true, trim: true, lowercase: true },
  universityId: { type: String, index: true },
  plan: { type: String, enum: ['free','startup','enterprise'], default: 'enterprise', index: true },
  keyPrefix: { type: String, unique: true, sparse: true, index: true },
  keyHash: { type: String },
  isActive: { type: Boolean, default: true },
  permissions: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Partner', PartnerSchema);
