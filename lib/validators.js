/**
 * lib/validators.js
 *
 * Funciones puras de validación y normalización de URLs.
 * Se aíslan del resto de la lógica de negocio porque se reutilizan
 * tanto en el cliente (validación instantánea en el input) como en
 * el servidor (segunda verificación antes de lanzar la petición HTTP).
 * Nunca hay que confiar solo en la validación del cliente.
 */

/**
 * Normaliza una entrada de usuario a una URL con protocolo explícito.
 * Si el usuario escribe "midominio.com", se antepone "https://".
 * @param {string} raw
 * @returns {string}
 */
export function normalizeUrl(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Valida que una cadena, tras normalizarla, sea una URL bien formada
 * con un host que contenga al menos un punto (para descartar
 * "https://localhost" o cadenas sin dominio real en el flujo público).
 * @param {string} raw
 * @returns {{ valid: boolean, url: string, reason?: string }}
 */
export function validateUrl(raw) {
  const normalized = normalizeUrl(raw);

  if (!normalized) {
    return { valid: false, url: '', reason: 'Introduce una URL para analizar.' };
  }

  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    return { valid: false, url: normalized, reason: 'La URL no tiene un formato válido.' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, url: normalized, reason: 'Solo se admiten URLs http o https.' };
  }

  const hostnameLooksValid = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(parsed.hostname);
  if (!hostnameLooksValid) {
    return { valid: false, url: normalized, reason: 'El dominio de la URL no parece válido.' };
  }

  return { valid: true, url: parsed.toString() };
}
