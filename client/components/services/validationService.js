export const validationService = {
  validateBatchData: (rows) => {
    const errors = [];
    if (!Array.isArray(rows) || rows.length === 0) {
      errors.push('Archivo vacío');
    }
    return { isValid: errors.length === 0, errors };
  }
};

export default validationService;