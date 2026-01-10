/**
 * Utilidad para exportar datos a CSV
 * Maneja correctamente el escape de caracteres especiales (comas, comillas, saltos de línea)
 */

/**
 * Escapa un valor para CSV, manejando comas, comillas y saltos de línea
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // Si contiene coma, comilla doble o salto de línea, lo envolvemos en comillas
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Escapamos comillas dobles duplicándolas
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Convierte un array de objetos a formato CSV
 * @param data - Array de objetos con los datos a exportar
 * @param headers - Objeto que mapea las claves a nombres de columnas en español
 * @returns String con el contenido CSV
 */
export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: Record<keyof T, string>
): string {
  if (data.length === 0) {
    return '';
  }

  // Obtener las claves en el orden especificado en headers
  const keys = Object.keys(headers) as Array<keyof T>;
  
  // Crear fila de encabezados
  const headerRow = keys.map(key => escapeCSVValue(headers[key])).join(',');
  
  // Crear filas de datos
  const dataRows = data.map(row => 
    keys.map(key => escapeCSVValue(row[key])).join(',')
  );
  
  // Combinar todo
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Descarga un string CSV como archivo
 * @param fileName - Nombre del archivo (sin extensión .csv)
 * @param csvContent - Contenido CSV como string
 */
export function downloadCSV(fileName: string, csvContent: string): void {
  // Agregar BOM para UTF-8 (ayuda con caracteres especiales en Excel)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Crear URL temporal
  const url = URL.createObjectURL(blob);
  
  // Crear elemento <a> temporal
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.csv`;
  link.style.display = 'none';
  
  // Agregar al DOM, hacer clic y remover
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Liberar URL temporal
  URL.revokeObjectURL(url);
}

/**
 * Función de conveniencia que genera y descarga un CSV en un solo paso
 * @param fileName - Nombre del archivo (sin extensión .csv)
 * @param data - Array de objetos con los datos a exportar
 * @param headers - Objeto que mapea las claves a nombres de columnas
 */
export function exportToCsv<T extends Record<string, unknown>>(
  fileName: string,
  data: T[],
  headers: Record<keyof T, string>
): void {
  const csvContent = generateCSV(data, headers);
  downloadCSV(fileName, csvContent);
}
