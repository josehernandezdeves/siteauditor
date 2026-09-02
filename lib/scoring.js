/**
 * lib/scoring.js
 *
 * Motor de puntuación. Recibe los datos crudos ya extraídos por
 * lib/analyzer.js y devuelve:
 *   - una lista de "issues" (hallazgos) con severidad y categoría,
 *   - la puntuación global (0-100).
 *
 * Se separa del analizador a propósito (principio de responsabilidad
 * única): analyzer.js sabe "cómo obtener los datos", scoring.js sabe
 * "cómo interpretarlos". Esto también permite testear el algoritmo de
 * puntuación con datos de ejemplo, sin necesidad de red.
 *
 * Cada penalización resta puntos de un total de 100. El resultado se
 * acota entre 0 y 100 con clamp().
 */

const WEIGHTS = {
  TITLE_MISSING: 15,
  TITLE_TOO_SHORT: 5,
  TITLE_TOO_LONG: 5,
  DESCRIPTION_MISSING: 15,
  DESCRIPTION_TOO_SHORT: 5,
  DESCRIPTION_TOO_LONG: 5,
  CANONICAL_MISSING: 5,
  ROBOTS_BLOCKING: 20,
  OG_TITLE_MISSING: 4,
  OG_DESCRIPTION_MISSING: 3,
  OG_IMAGE_MISSING: 3,
  H1_MISSING: 10,
  H1_MULTIPLE: 5,
  HEADING_ORDER_BROKEN: 4,
  IMAGES_ALT_MISSING_RATIO: 15, // se escala según el % de imágenes sin alt
  SLOW_RESPONSE: 10,
  VERY_SLOW_RESPONSE: 20,
  HTTP_ERROR_STATUS: 25,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Construye un objeto "issue" homogéneo para toda la app.
 * @param {'error'|'warning'|'success'} severity
 * @param {'rendimiento'|'metaetiquetas'|'estructura'} category
 * @param {string} message
 * @param {string} [detail]
 */
function issue(severity, category, message, detail) {
  return { severity, category, message, detail: detail || null };
}

/**
 * Evalúa el bloque de rendimiento (latencia + código de estado).
 */
function scorePerformance(timing, deductions, issues) {
  const { ms, status, ok } = timing;

  if (!ok) {
    deductions.push(WEIGHTS.HTTP_ERROR_STATUS);
    issues.push(
      issue(
        'error',
        'rendimiento',
        `El sitio respondió con un código de estado ${status}.`,
        'Un código fuera del rango 200-299 puede indicar una página caída, redirigida incorrectamente o bloqueada.'
      )
    );
  } else if (ms >= 2000) {
    deductions.push(WEIGHTS.VERY_SLOW_RESPONSE);
    issues.push(
      issue(
        'error',
        'rendimiento',
        `Tiempo de respuesta muy alto: ${ms} ms.`,
        'Por encima de 2000 ms afecta directamente la experiencia de usuario y el posicionamiento en buscadores.'
      )
    );
  } else if (ms >= 800) {
    deductions.push(WEIGHTS.SLOW_RESPONSE);
    issues.push(
      issue(
        'warning',
        'rendimiento',
        `Tiempo de respuesta mejorable: ${ms} ms.`,
        'Se recomienda mantenerlo por debajo de 800 ms para una buena experiencia percibida.'
      )
    );
  } else {
    issues.push(
      issue('success', 'rendimiento', `Tiempo de respuesta óptimo: ${ms} ms.`)
    );
  }

  if (ok) {
    issues.push(issue('success', 'rendimiento', `Código de estado HTTP correcto: ${status}.`));
  }
}

/**
 * Evalúa el bloque de metaetiquetas (title, description, canonical,
 * robots y Open Graph).
 */
function scoreMetaTags(meta, deductions, issues) {
  // --- Title ---
  if (!meta.title) {
    deductions.push(WEIGHTS.TITLE_MISSING);
    issues.push(
      issue('error', 'metaetiquetas', 'Falta la etiqueta <title>.', 'Es el factor on-page más influyente para SEO y para el CTR en resultados de búsqueda.')
    );
  } else if (meta.title.length < 30) {
    deductions.push(WEIGHTS.TITLE_TOO_SHORT);
    issues.push(
      issue('warning', 'metaetiquetas', `El title es muy corto (${meta.title.length} caracteres).`, 'Se recomienda entre 30 y 60 caracteres para aprovechar el espacio en los resultados de búsqueda.')
    );
  } else if (meta.title.length > 60) {
    deductions.push(WEIGHTS.TITLE_TOO_LONG);
    issues.push(
      issue('warning', 'metaetiquetas', `El title es muy largo (${meta.title.length} caracteres).`, 'Google suele truncar los títulos que superan los 60 caracteres aproximadamente.')
    );
  } else {
    issues.push(issue('success', 'metaetiquetas', `Title con longitud adecuada (${meta.title.length} caracteres).`));
  }

  // --- Meta description ---
  if (!meta.description) {
    deductions.push(WEIGHTS.DESCRIPTION_MISSING);
    issues.push(
      issue('error', 'metaetiquetas', 'Falta la meta description.', 'Sin ella, los buscadores generan un fragmento automático que suele ser menos persuasivo.')
    );
  } else if (meta.description.length < 70) {
    deductions.push(WEIGHTS.DESCRIPTION_TOO_SHORT);
    issues.push(
      issue('warning', 'metaetiquetas', `La meta description es corta (${meta.description.length} caracteres).`, 'Se recomienda entre 70 y 160 caracteres.')
    );
  } else if (meta.description.length > 160) {
    deductions.push(WEIGHTS.DESCRIPTION_TOO_LONG);
    issues.push(
      issue('warning', 'metaetiquetas', `La meta description es larga (${meta.description.length} caracteres).`, 'Puede aparecer truncada en los resultados de búsqueda.')
    );
  } else {
    issues.push(issue('success', 'metaetiquetas', `Meta description con longitud adecuada (${meta.description.length} caracteres).`));
  }

  // --- Canonical ---
  if (!meta.canonical) {
    deductions.push(WEIGHTS.CANONICAL_MISSING);
    issues.push(
      issue('warning', 'metaetiquetas', 'No se encontró una etiqueta canonical.', 'Ayuda a prevenir problemas de contenido duplicado.')
    );
  } else {
    issues.push(issue('success', 'metaetiquetas', 'Etiqueta canonical presente.'));
  }

  // --- Robots ---
  if (meta.robots && /noindex/i.test(meta.robots)) {
    deductions.push(WEIGHTS.ROBOTS_BLOCKING);
    issues.push(
      issue('error', 'metaetiquetas', `La meta robots impide la indexación (${meta.robots}).`, 'Si esto no es intencional, los buscadores no podrán mostrar esta página en sus resultados.')
    );
  } else {
    issues.push(issue('success', 'metaetiquetas', meta.robots ? `Meta robots permite indexación (${meta.robots}).` : 'No hay restricciones de indexación vía meta robots.'));
  }

  // --- Open Graph ---
  if (!meta.ogTitle) {
    deductions.push(WEIGHTS.OG_TITLE_MISSING);
    issues.push(issue('warning', 'metaetiquetas', 'Falta og:title.', 'Afecta a cómo se ve el enlace al compartirlo en redes sociales.'));
  } else {
    issues.push(issue('success', 'metaetiquetas', 'og:title presente.'));
  }

  if (!meta.ogDescription) {
    deductions.push(WEIGHTS.OG_DESCRIPTION_MISSING);
    issues.push(issue('warning', 'metaetiquetas', 'Falta og:description.'));
  } else {
    issues.push(issue('success', 'metaetiquetas', 'og:description presente.'));
  }

  if (!meta.ogImage) {
    deductions.push(WEIGHTS.OG_IMAGE_MISSING);
    issues.push(issue('warning', 'metaetiquetas', 'Falta og:image.', 'Sin ella, los enlaces compartidos en redes sociales aparecen sin imagen de vista previa.'));
  } else {
    issues.push(issue('success', 'metaetiquetas', 'og:image presente.'));
  }
}

/**
 * Evalúa el bloque de estructura HTML: jerarquía de encabezados
 * e imágenes sin atributo alt.
 */
function scoreStructure(structure, deductions, issues) {
  const { headings, images } = structure;

  if (headings.h1.count === 0) {
    deductions.push(WEIGHTS.H1_MISSING);
    issues.push(issue('error', 'estructura', 'No se encontró ninguna etiqueta <h1>.', 'El H1 comunica el tema principal de la página tanto a usuarios como a buscadores.'));
  } else if (headings.h1.count > 1) {
    deductions.push(WEIGHTS.H1_MULTIPLE);
    issues.push(issue('warning', 'estructura', `Se encontraron ${headings.h1.count} etiquetas <h1>.`, 'Lo recomendable es usar un único H1 por página.'));
  } else {
    issues.push(issue('success', 'estructura', 'Se encontró exactamente un <h1>.'));
  }

  if (headings.h1.count > 0 && headings.h2.count === 0 && headings.h3.count > 0) {
    deductions.push(WEIGHTS.HEADING_ORDER_BROKEN);
    issues.push(issue('warning', 'estructura', 'Hay <h3> sin <h2> intermedios.', 'Romper la jerarquía dificulta la lectura del documento para lectores de pantalla y buscadores.'));
  } else {
    issues.push(issue('success', 'estructura', 'La jerarquía de encabezados es coherente.'));
  }

  if (images.total === 0) {
    issues.push(issue('success', 'estructura', 'La página no contiene imágenes que auditar.'));
  } else if (images.missingAlt > 0) {
    const ratio = images.missingAlt / images.total;
    const penalty = Math.round(WEIGHTS.IMAGES_ALT_MISSING_RATIO * ratio);
    deductions.push(penalty);
    issues.push(
      issue(
        'warning',
        'estructura',
        `${images.missingAlt} de ${images.total} imágenes no tienen atributo alt.`,
        'El atributo alt es clave para accesibilidad y para el posicionamiento en la búsqueda de imágenes.'
      )
    );
  } else {
    issues.push(issue('success', 'estructura', `Todas las imágenes (${images.total}) tienen atributo alt.`));
  }
}

/**
 * Punto de entrada del motor de puntuación.
 * @param {object} data - Objeto devuelto por analyzer.js (sin el score).
 * @returns {{ score: number, issues: Array }}
 */
export function computeHealthScore(data) {
  const deductions = [];
  const issues = [];

  scorePerformance(data.timing, deductions, issues);
  scoreMetaTags(data.meta, deductions, issues);
  scoreStructure(data.structure, deductions, issues);

  const totalDeduction = deductions.reduce((sum, value) => sum + value, 0);
  const score = clamp(Math.round(100 - totalDeduction), 0, 100);

  // Orden estable: errores primero, luego advertencias, luego éxitos.
  const severityOrder = { error: 0, warning: 1, success: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return { score, issues };
}
