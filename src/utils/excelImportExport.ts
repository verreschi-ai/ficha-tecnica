import * as XLSX from 'xlsx';

/**
 * Downloads a native Excel (.xlsx) file template ready for immediate typing.
 */
export function downloadExcelTemplate(
  filename: string,
  headers: string[],
  sampleRows: (string | number)[][]
) {
  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths so columns look clean and readable
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 5, 20) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Modelo');

  // Write file as xlsx array buffer and trigger browser download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses XLSX, XLS, or CSV files into a 2D array of strings.
 */
export async function parseExcelOrCsvFile(file: File): Promise<string[][]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  // Convert worksheet to array of arrays
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: ''
  });

  return rawRows.map(row =>
    Array.isArray(row) ? row.map(cell => String(cell ?? '').trim()) : []
  );
}

/**
 * Safely parses price values from various spreadsheet formats (e.g., "R$ 12,50", "12.50", "1.250,50", 12.5)
 */
export function parsePriceValue(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  let str = String(val).trim();
  if (!str) return 0;

  // Remove currency symbols, spaces
  str = str.replace(/R\$/gi, '').replace(/\$/g, '').trim();

  // If contains both '.' and ',', e.g. "1.250,50" vs "1,250.50"
  if (str.includes('.') && str.includes(',')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // Brazilian style: 1.250,50 -> 1250.50
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US style: 1,250.50 -> 1250.50
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Single comma: 12,50 -> 12.50
    str = str.replace(',', '.');
  }

  // Keep only digits and decimal point
  str = str.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Aliases for backward compatibility
 */
export const downloadCsvTemplate = downloadExcelTemplate;
export const parseCsvFile = parseExcelOrCsvFile;

