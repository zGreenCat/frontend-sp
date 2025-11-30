/**
 * Formatea una fecha ISO a formato legible en español
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formatea una fecha ISO a formato con hora
 */
export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formatea una fecha a formato relativo (hace X tiempo)
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Hace un momento';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `Hace ${diffInWeeks} ${diffInWeeks === 1 ? 'semana' : 'semanas'}`;
  }

  return formatDate(date);
}

/**
 * Valida un RUT chileno
 */
export function validateRUT(rut: string): boolean {
  // Eliminar puntos y guiones
  const cleanRut = rut.replace(/[.-]/g, '');
  
  if (cleanRut.length < 2) return false;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDV = 11 - (sum % 11);
  const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();

  return dv === calculatedDV;
}

/**
 * Formatea un RUT con puntos y guión
 * Maneja múltiples formatos de entrada:
 * - 234567896 -> 23.456.789-6
 * - 198765430 -> 19.876.543-0
 * - 11111111 -> 1.111.111-1
 * - 17.567.890-1 -> 17.567.890-1
 * - 17567890-1 -> 17.567.890-1
 */
export function formatRUT(rut: string | null | undefined): string {
  // Validar entrada
  if (!rut || typeof rut !== 'string') return '';
  
  // Limpiar el RUT: eliminar puntos, guiones y espacios
  const cleanRut = rut.replace(/[.\-\s]/g, '').trim();
  
  // Validar que tenga al menos 2 caracteres (1 dígito + DV)
  if (cleanRut.length < 2) return rut;

  // Separar cuerpo y dígito verificador
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  // Validar que el cuerpo solo contenga números
  if (!/^\d+$/.test(body)) return rut;

  // Agregar puntos cada 3 dígitos de derecha a izquierda
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedBody}-${dv}`;
}

/**
 * Trunca un texto a una longitud máxima
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Capitaliza la primera letra de un string
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Genera un ID único simple
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-CL').format(num);
}

/**
 * Valida un email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida un teléfono chileno
 */
export function validatePhone(phone: string): boolean {
  // Acepta formatos: +56912345678, 912345678, +56 9 1234 5678
  const cleanPhone = phone.replace(/[\s-]/g, '');
  const phoneRegex = /^(\+?56)?[9]\d{8}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Formatea un teléfono chileno
 */
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/[\s+-]/g, '');
  
  if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
    return `+56 ${cleanPhone[0]} ${cleanPhone.slice(1, 5)} ${cleanPhone.slice(5)}`;
  }
  
  if (cleanPhone.length === 11 && cleanPhone.startsWith('56')) {
    const number = cleanPhone.slice(2);
    return `+56 ${number[0]} ${number.slice(1, 5)} ${number.slice(5)}`;
  }

  return phone;
}
