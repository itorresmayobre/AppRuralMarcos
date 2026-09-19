/**
 * Validador oficial del dígito verificador de Cédula de Identidad de Uruguay
 * Soporta C.I. de 5 a 8 dígitos (ej: 44.567-8, 123.456-7, 1.234.567-8)
 */
export function validarCIUruguaya(ci: string): boolean {
  if (!ci) return false;
  const ciLimpia = ci.replace(/\D/g, '');
  
  if (ciLimpia.length < 5 || ciLimpia.length > 8) {
    return false;
  }

  const ciPadded = ciLimpia.padStart(8, '0');
  const multiplicadores = [2, 9, 8, 7, 6, 3, 4];
  
  let suma = 0;
  for (let i = 0; i < 7; i++) {
    suma += parseInt(ciPadded[i], 10) * multiplicadores[i];
  }

  const digitoEsperado = (10 - (suma % 10)) % 10;
  const digitoIngresado = parseInt(ciPadded[7], 10);

  return digitoEsperado === digitoIngresado;
}

/**
 * Formatea automáticamente una C.I. uruguaya a formato visual estándar.
 * Ejemplos:
 *  - 445678   -> 44.567-8
 *  - 1234567  -> 123.456-7
 *  - 12345678 -> 1.234.567-8
 */
export function formatearCIUruguaya(ci: string): string {
  const ciLimpia = ci.replace(/\D/g, '').slice(0, 8);
  if (ciLimpia.length === 0) return '';
  if (ciLimpia.length === 1) return ciLimpia;

  const cuerpo = ciLimpia.slice(0, -1);
  const digitoVerificador = ciLimpia.slice(-1);

  // Formatear el cuerpo agregando puntos cada 3 dígitos desde la derecha
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${cuerpoFormateado}-${digitoVerificador}`;
}

/**
 * Valida formato de teléfono de Uruguay (Celulares de 9 dígitos empezando en 09, o Fijos de 8 dígitos empezando en 2 o 4)
 */
export function validarTelefonoUruguayo(tel: string): boolean {
  if (!tel) return false;
  const num = tel.replace(/\D/g, '');

  // Celular Uruguayo: 9 dígitos comenzando por 09 (ej: 099123456)
  if (num.length === 9 && num.startsWith('09')) {
    return true;
  }

  // Teléfono Fijo Uruguayo: 8 dígitos comenzando por 2 o 4 (ej: 45321234 / 24001234)
  if (num.length === 8 && (num.startsWith('2') || num.startsWith('4'))) {
    return true;
  }

  return false;
}

/**
 * Formatea un teléfono de Uruguay automáticamente mientras el usuario escribe.
 * Ej: 099123456 -> 099 123 456
 * Ej: 45321234  -> 4532 1234
 */
export function formatearTelefonoUruguayo(tel: string): string {
  const num = tel.replace(/\D/g, '').slice(0, 9);
  if (num.length === 0) return '';

  // Si empieza con 09 (Celular, max 9 dígitos: 099 123 456)
  if (num.startsWith('09')) {
    if (num.length <= 3) return num;
    if (num.length <= 6) return `${num.slice(0, 3)} ${num.slice(3)}`;
    return `${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
  }

  // Si es fijo (8 dígitos: 4532 1234)
  if (num.length <= 4) return num;
  return `${num.slice(0, 4)} ${num.slice(4, 8)}`;
}
