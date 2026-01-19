const crypto = require('crypto');

/**
 * Genera un ID académico único (Hash de Identidad)
 * Cumple con privacidad por diseño: no revela datos sensibles pero es único y verificable.
 * Formato: AC-[INICIALES]-[HASH_CORTO]
 * @param {string} studentName - Nombre completo del estudiante
 * @param {string} institution - Nombre de la institución
 * @param {string} salt - Opcional: identificador adicional (e.g. matrícula o fecha)
 * @returns {string} El ID Académico Único (e.g., AC-JP-A1B2C)
 */
const generateUniqueAcademicId = (studentName, institution, salt = '') => {
  // Limpieza básica
  const cleanName = (studentName || '').trim().toUpperCase();
  const cleanInst = (institution || '').trim().toUpperCase();
  
  // Obtener iniciales (Juan Pérez -> JP)
  const names = cleanName.split(/\s+/);
  const initials = names.map(n => n[0]).join('').slice(0, 3); // Máx 3 letras
  
  // Generar hash determinista
  // Mezclamos Nombre + Institución + Salt + Timestamp (si no hay salt específico)
  // Nota: Si queremos que sea determinista (mismo input = mismo ID), el salt debe ser fijo (ej. matrícula).
  // Si queremos unicidad absoluta por emisión, usamos un random o timestamp.
  const entropy = salt || crypto.randomBytes(4).toString('hex');
  const rawString = `${cleanName}|${cleanInst}|${entropy}`;
  
  const hash = crypto.createHash('sha256').update(rawString).digest('hex');
  const shortHash = hash.substring(0, 6).toUpperCase(); // 6 caracteres de hash

  return `AC-${initials}-${shortHash}`;
};

module.exports = {
  generateUniqueAcademicId
};
