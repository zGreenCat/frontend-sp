/**
 * Utilidades para validación y formateo de RUT chileno
 * Reglas de negocio para identificación de usuarios
 */

/**
 * Formatea un RUT chileno progresivamente mientras se escribe
 * @param raw - RUT sin formato (solo números y K)
 * @returns RUT formateado (ej: 12.345.678-9)
 */
export function formatRut(raw: string): string {
  // Dejar solo números y K/k
  const clean = raw.replace(/[^\dkK]/g, "").toUpperCase();

  if (clean.length === 0) return "";

  // Si solo hay 1–3 caracteres: no formateamos aún
  if (clean.length <= 3) {
    return clean;
  }

  // Si hay 4 caracteres: cuerpo + DV, pero sin puntos todavía
  if (clean.length === 4) {
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    return `${body}-${dv}`;
  }

  // De 5 en adelante: cuerpo con puntos + DV
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  const reversed = body.split("").reverse().join("");
  const chunks = reversed.match(/.{1,3}/g) || [];
  const bodyWithDotsReversed = chunks.join(".");
  const bodyWithDots = bodyWithDotsReversed.split("").reverse().join("");

  return `${bodyWithDots}-${dv}`;
}

/**
 * Valida un RUT chileno verificando su dígito verificador
 * Implementa el algoritmo oficial de módulo 11
 * @param rut - RUT a validar (puede estar formateado o no)
 * @returns true si el RUT es válido, false en caso contrario
 */
export function validateChileanRut(rut: string): boolean {
  if (!rut) return true; // Si está vacío, lo maneja la validación de required

  // Eliminar puntos y guiones
  const cleanRut = rut.replace(/[.-]/g, "").toUpperCase();

  // Validar formato: 6-8 dígitos + dígito verificador (0-9 o K)
  if (!/^\d{6,8}[0-9K]$/.test(cleanRut)) {
    return false;
  }

  // Extraer número y dígito verificador
  const rutNumber = cleanRut.slice(0, -1);
  const verifierDigit = cleanRut.slice(-1);

  // Calcular dígito verificador esperado usando algoritmo de módulo 11
  let sum = 0;
  let multiplier = 2;

  for (let i = rutNumber.length - 1; i >= 0; i--) {
    sum += parseInt(rutNumber[i], 10) * multiplier;
    multiplier++;
    if (multiplier > 7) {
      multiplier = 2;
    }
  }

  const remainder = 11 - (sum % 11);
  const expectedVerifier =
    remainder === 11 ? "0" : remainder === 10 ? "K" : remainder.toString();

  return verifierDigit === expectedVerifier;
}

/**
 * Limpia un RUT formateado dejando solo números y K
 * @param rut - RUT formateado
 * @returns RUT sin formato (ej: "12345678K")
 */
export function cleanRut(rut: string): string {
  return rut.replace(/[.-]/g, "").toUpperCase();
}

/**
 * Obtiene el mensaje de error apropiado para un RUT inválido
 * @param rut - RUT a validar
 * @returns Mensaje de error o null si es válido
 */
export function getRutErrorMessage(rut: string): string | null {
  if (!rut) return null;

  const cleanRutValue = cleanRut(rut);

  if (!/^\d{6,8}[0-9K]$/.test(cleanRutValue)) {
    return "Formato de RUT inválido";
  }

  if (!validateChileanRut(rut)) {
    return "RUT chileno no válido (verificar dígito verificador)";
  }

  return null;
}
