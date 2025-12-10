const ExcelJS = require('exceljs');

function sanitizeString(s, { stripHtml = true, maxLen = 1024 } = {}) {
  let v = String(s || '');
  if (v.length > maxLen) v = v.slice(0, maxLen);
  v = v.replace(/[\u0000-\u001F\u007F]/g, '');
  v = v.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  if (stripHtml) v = v.replace(/<[^>]+>/g, '');
  return v.trim();
}

class AcademicExcelProcessor {
  constructor(config = {}) {
    this.config = {
      maxFileSize: 10 * 1024 * 1024,
      maxRows: 10000,
      maxColumns: 100,
      maxSheets: 10,
      allowedExtensions: ['.xlsx', '.xls', '.csv'],
      allowFormulas: false,
      allowMacros: false,
      allowHyperlinks: false,
      sanitizeHTML: true,
      maskSensitive: true,
      ...config,
    };
    this.stats = { filesProcessed: 0, rowsProcessed: 0, securityBlocks: 0, errors: 0 };
  }

  validateFile(fileBuffer, fileName = '') {
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) throw new Error('Archivo inválido');
    if (fileBuffer.length > this.config.maxFileSize) throw new Error('Archivo demasiado grande');
    if (fileName) {
      const i = fileName.lastIndexOf('.');
      const ext = i >= 0 ? fileName.slice(i).toLowerCase() : '';
      if (ext && !this.config.allowedExtensions.includes(ext)) throw new Error('Extensión no permitida');
    }
    this.validateExcelHeader(fileBuffer);
    return true;
  }

  validateExcelHeader(buffer) {
    const h = buffer.slice(0, 8);
    if (h[0] === 0x50 && h[1] === 0x4B) return true;
    if (h[0] === 0xD0 && h[1] === 0xCF && h[2] === 0x11 && h[3] === 0xE0) return true;
    throw new Error('Archivo no es un Excel válido');
  }

  async processSecure(fileBuffer, options = {}) {
    const start = Date.now();
    try {
      this.validateFile(fileBuffer, options.fileName);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);
      this.validateWorkbookStructure(workbook);
      const extracted = await this.extractSafeData(workbook, options);
      this.stats.filesProcessed += 1;
      this.stats.rowsProcessed += extracted.totalRows;
      const timeMs = Date.now() - start;
      return {
        success: true,
        data: extracted.data,
        metadata: {
          sheets: extracted.sheets,
          totalRows: extracted.totalRows,
          totalColumns: extracted.totalColumns,
          processingTime: `${timeMs}ms`,
          securityLevel: 'high',
        },
        warnings: extracted.warnings,
      };
    } catch (e) {
      this.stats.errors += 1;
      return {
        success: false,
        error: 'Error procesando archivo Excel',
        userMessage: 'No se pudo procesar el archivo. Verifique que sea válido y no exceda los límites.',
        internalCode: 'EXCEL_PROCESSING_ERROR',
      };
    }
  }

  validateWorkbookStructure(workbook) {
    if ((workbook.worksheets || []).length > this.config.maxSheets) throw new Error('Demasiadas hojas');
    for (const ws of workbook.worksheets) {
      const rows = ws.rowCount || 0;
      const cols = (ws.columns || []).length || 0;
      if (rows > this.config.maxRows) throw new Error('Hoja con demasiadas filas');
      if (cols > this.config.maxColumns) throw new Error('Hoja con demasiadas columnas');
    }
  }

  validateCellContents(ws) {
    const warnings = [];
    const stripHtml = !!this.config.sanitizeHTML;
    for (let r = 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= (ws.columns || []).length; c++) {
        const cell = row.getCell(c);
        const v = cell.value;
        if (v && typeof v === 'object' && 'formula' in v) {
          if (!this.config.allowFormulas) warnings.push(`formula_blocked@R${r}C${c}`);
        }
        if (cell.hyperlink && !this.config.allowHyperlinks) warnings.push(`hyperlink_blocked@R${r}C${c}`);
        if (typeof v === 'string' && stripHtml) {
          const sv = sanitizeString(v, { stripHtml, maxLen: 1024 });
          if (sv !== v) warnings.push(`sanitized@R${r}C${c}`);
        }
        if (typeof v === 'string' && this.config.maskSensitive) {
          const { masked } = this.maskSensitiveData(v);
          if (masked) warnings.push(`masked_sensitive@R${r}C${c}`);
        }
      }
    }
    this.stats.securityBlocks += warnings.length;
    return warnings;
  }

  async extractSafeData(workbook, { headerRow = 1 } = {}) {
    const data = {};
    const warnings = [];
    let totalRows = 0;
    let totalColumns = 0;
    const sheets = [];
    for (const ws of workbook.worksheets) {
      const sheetName = ws.name || `Sheet${sheets.length + 1}`;
      const sheetWarnings = this.validateCellContents(ws);
      warnings.push(...sheetWarnings);
      const cols = Math.min((ws.columns || []).length, this.config.maxColumns);
      const rows = Math.min(ws.rowCount, this.config.maxRows);
      totalRows += Math.max(0, rows - headerRow);
      totalColumns = Math.max(totalColumns, cols);
      const header = [];
      const headerCells = ws.getRow(headerRow);
      for (let c = 1; c <= cols; c++) {
        const hv = headerCells.getCell(c).value;
        const hn = sanitizeString(hv == null ? `col_${c}` : hv, { stripHtml: this.config.sanitizeHTML, maxLen: 128 }) || `col_${c}`;
        header.push(hn);
      }
      const rowsData = [];
      for (let r = headerRow + 1; r <= rows; r++) {
        const row = ws.getRow(r);
        const obj = {};
        for (let c = 1; c <= cols; c++) {
          const cell = row.getCell(c);
          const val = cell.value;
          let out = '';
          if (val == null) {
            out = '';
          } else if (typeof val === 'object' && 'formula' in val) {
            out = this.config.allowFormulas ? sanitizeString(val.result, { stripHtml: this.config.sanitizeHTML }) : '';
          } else if (typeof val === 'string') {
            out = sanitizeString(val, { stripHtml: this.config.sanitizeHTML });
            if (this.config.maskSensitive) {
              const res = this.maskSensitiveData(out);
              if (res.masked) {
                out = res.value;
                warnings.push(`masked_sensitive@R${r}C${c}`);
                this.stats.securityBlocks += 1;
              }
            }
          } else {
            out = String(val);
          }
          obj[header[c - 1]] = out;
        }
        rowsData.push(obj);
      }
      data[sheetName] = rowsData;
      sheets.push({ name: sheetName, rows: rowsData.length, columns: cols });
    }
    return { data, sheets, totalRows, totalColumns, warnings };
  }

  getSecurityReport() {
    return { ...this.stats };
  }

  maskSensitiveData(text) {
    let v = String(text || '');
    let masked = false;
    // Email addresses
    v = v.replace(/([A-Z0-9._%+-])([A-Z0-9._%+-]*)(@[A-Z0-9.-]+\.[A-Z]{2,})/gi, (m, first, middle, domain) => {
      masked = true;
      const stars = middle.length ? '*'.repeat(Math.min(middle.length, 6)) : '***';
      return `${first}${stars}${domain}`;
    });
    // Phone numbers (7-15 digits, allow separators)
    v = v.replace(/\b(?:\+?\d[\s-]?){7,15}\b/g, (m) => {
      const digits = m.replace(/[^\d]/g, '');
      if (digits.length < 7) return m;
      masked = true;
      const keep = digits.slice(-2);
      const hidden = '*'.repeat(Math.max(5, digits.length - 2));
      return `${hidden}${keep}`;
    });
    // Generic ID numbers (8-12 consecutive digits)
    v = v.replace(/\b\d{8,12}\b/g, (m) => {
      masked = true;
      return `${'*'.repeat(m.length - 3)}${m.slice(-3)}`;
    });
    return { value: v, masked };
  }
}

module.exports = { AcademicExcelProcessor, sanitizeString };
