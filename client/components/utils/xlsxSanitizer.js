import * as XLSX from 'xlsx';
import { sanitizeString } from './security';

const MAX_ROWS = 10000;
const MAX_COLS = 100;
const MAX_CELL_LEN = 1024;

function sanitizeValue(v) {
  if (v == null) return '';
  let s = String(v);
  if (s.length > MAX_CELL_LEN) s = s.slice(0, MAX_CELL_LEN);
  return sanitizeString(s);
}

export function readSafe(binaryStr) {
  const wb = XLSX.read(binaryStr, {
    type: 'binary',
    raw: true,
    cellNF: false,
    cellFormula: false,
    bookVBA: false,
    WTF: false
  });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return { wb, ws, sheetName };
}

export function sheetToSanitizedJSON(ws) {
  const opts = { header: 1, blankrows: false, defval: '' };
  const rows = XLSX.utils.sheet_to_json(ws, opts);
  const limited = rows.slice(0, MAX_ROWS).map(r => (Array.isArray(r) ? r.slice(0, MAX_COLS) : []));
  const headers = limited[0] || [];
  const body = limited.slice(1);
  return body.map(arr => {
    const row = {};
    headers.forEach((h, i) => { row[sanitizeValue(h || `col_${i+1}`)] = sanitizeValue(arr[i]); });
    return row;
  });
}

const xlsxSanitizer = { readSafe, sheetToSanitizedJSON };
export default xlsxSanitizer;
