'use server';

import { validateUrl } from '@/lib/validators';
import { analyzeUrl } from '@/lib/analyzer';
import { computeHealthScore } from '@/lib/scoring';

/**
 * app/actions/analyze.js
 *
 * Server Action que orquesta el flujo completo de auditoría:
 * validar -> analizar -> puntuar. Se ejecuta exclusivamente en el
 * servidor (directiva 'use server'), por lo que ninguna credencial,
 * librería de scraping (axios, cheerio) ni lógica de negocio viaja
 * nunca al bundle del cliente.
 *
 * El componente cliente (app/page.js) importa esta función y la
 * invoca como si fuera una función normal; Next.js se encarga de
 * serializar la llamada como un POST interno.
 *
 * @param {string} rawUrl - Valor tal cual lo escribió el usuario.
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function runAudit(rawUrl) {
  const { valid, url, reason } = validateUrl(rawUrl);

  if (!valid) {
    return { success: false, error: reason };
  }

  const raw = await analyzeUrl(url);

  if (raw.error) {
    return { success: false, error: raw.error };
  }

  const { score, issues } = computeHealthScore(raw);

  return {
    success: true,
    data: {
      ...raw,
      score,
      issues,
    },
  };
}
