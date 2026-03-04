import * as XLSX from 'xlsx';

export const fileParser = {
  parseFile: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, // Get array of arrays first to handle headers
            defval: '' 
          });

          if (jsonData.length === 0) {
            resolve([]);
            return;
          }

          // Extract headers (first row)
          const headers = jsonData[0].map(h => String(h).trim());
          
          // Map data to objects
          const result = jsonData.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              // Handle potential undefined values in row
              let val = row[index];
              if (val === undefined || val === null) val = '';
              obj[header] = String(val).trim();
            });
            return obj;
          });

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  },

  // Legacy support but improved
  parseCSV: async (file) => {
    return fileParser.parseFile(file);
  }
};

export default fileParser;