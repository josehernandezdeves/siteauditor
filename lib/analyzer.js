import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * lib/analyzer.js
 *
 * Motor de extracción de datos. Responsabilidad única: dada una URL,
 * hacer la petición HTTP, medir su latencia y extraer del HTML todo
 * lo que las tarjetas del reporte necesitan mostrar. No calcula
 * puntuaciones (eso vive en lib/scoring.js) ni sabe nada de React:
 * es una función de servidor pura en cuanto a su contrato de entrada/salida.
 */

const REQUEST_TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 5;

/**
 * Lee un atributo "content" de una meta etiqueta buscando por
 * "name" o por "property" (Open Graph usa "property").
 */
function readMeta($, selector) {
  const value = $(selector).attr('content');
  return value ? value.trim() : null;
}

/**
 * Extrae y clasifica los encabezados h1/h2/h3 del documento.
 */
function extractHeadings($) {
  const build = (tag) => {
    const nodes = $(tag)
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);
    return { count: nodes.length, samples: nodes.slice(0, 5) };
  };

  return {
    h1: build('h1'),
    h2: build('h2'),
    h3: build('h3'),
  };
}

/**
 * Cuenta imágenes totales y aquellas sin atributo alt (o con alt vacío).
 */
function extractImages($) {
  const imgs = $('img');
  let missingAlt = 0;

  imgs.each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt === undefined || alt.trim() === '') {
      missingAlt += 1;
    }
  });

  return { total: imgs.length, missingAlt };
}

/**
 * Ejecuta el análisis completo de una URL ya validada.
 * @param {string} url - URL absoluta, ya normalizada y validada.
 * @returns {Promise<object>} Datos crudos de la auditoría (sin score).
 */
export async function analyzeUrl(url) {
  const startedAt = Date.now();

  let response;
  try {
    response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT_MS,
      maxRedirects: MAX_REDIRECTS,
      // Aceptamos cualquier código de estado: queremos poder reportar
      // errores 4xx/5xx en vez de que axios los convierta en excepción.
      validateStatus: () => true,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; SiteAuditorBot/1.0; +https://siteauditor.local)',
        Accept: 'text/html,application/xhtml+xml',
      },
      responseType: 'text',
      // Evita descargar respuestas gigantes (por ejemplo, streams binarios
      // servidos con content-type incorrecto).
      maxContentLength: 10 * 1024 * 1024,
    });
  } catch (error) {
    const ms = Date.now() - startedAt;
    return buildFailureResult(url, ms, error);
  }

  const ms = Date.now() - startedAt;
  const html = typeof response.data === 'string' ? response.data : String(response.data);
  const $ = cheerio.load(html);

  const meta = {
    title: $('title').first().text().trim() || null,
    description: readMeta($, 'meta[name="description"]'),
    canonical: $('link[rel="canonical"]').attr('href') || null,
    robots: readMeta($, 'meta[name="robots"]'),
    ogTitle: readMeta($, 'meta[property="og:title"]'),
    ogDescription: readMeta($, 'meta[property="og:description"]'),
    ogImage: readMeta($, 'meta[property="og:image"]'),
  };

  const structure = {
    headings: extractHeadings($),
    images: extractImages($),
  };

  return {
    url,
    fetchedAt: new Date().toISOString(),
    timing: {
      ms,
      status: response.status,
      ok: response.status >= 200 && response.status < 300,
    },
    meta,
    structure,
    error: null,
  };
}

/**
 * Construye un resultado homogéneo cuando la petición HTTP falla por
 * completo (timeout, DNS, TLS, conexión rechazada, etc.), para que la
 * UI pueda mostrar un estado de error claro en vez de romperse.
 */
function buildFailureResult(url, ms, error) {
  let reason = 'No se pudo completar la petición al sitio web.';

  if (error.code === 'ECONNABORTED') {
    reason = `El sitio no respondió dentro del límite de ${REQUEST_TIMEOUT_MS / 1000} segundos.`;
  } else if (error.code === 'ENOTFOUND') {
    reason = 'No se pudo resolver el dominio. Verifica que la URL sea correcta.';
  } else if (error.code === 'ECONNREFUSED') {
    reason = 'La conexión fue rechazada por el servidor de destino.';
  } else if (error.response) {
    reason = `El servidor respondió con un error (${error.response.status}).`;
  }

  return {
    url,
    fetchedAt: new Date().toISOString(),
    timing: { ms, status: error.response?.status || 0, ok: false },
    meta: {
      title: null,
      description: null,
      canonical: null,
      robots: null,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
    },
    structure: {
      headings: { h1: { count: 0, samples: [] }, h2: { count: 0, samples: [] }, h3: { count: 0, samples: [] } },
      images: { total: 0, missingAlt: 0 },
    },
    error: reason,
  };
}
