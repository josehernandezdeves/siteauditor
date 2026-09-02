# Documentación técnica de SiteAuditor

Este documento explica, archivo por archivo, la arquitectura completa de
SiteAuditor. Para cada archivo encontrarás cuatro apartados:

- **Qué hace** — su rol exacto dentro de la arquitectura.
- **Cómo lo hace** — la lógica técnica y las funciones implementadas.
- **Por qué se hace así** — las decisiones de diseño y buenas prácticas.
- **Ejemplo de código real** — un fragmento extraído directamente del archivo.

---

## Arquitectura general, en una frase

`UrlForm` (cliente) → `runAudit` (Server Action) → `validateUrl` →
`analyzeUrl` (axios + cheerio) → `computeHealthScore` → de vuelta al
cliente → tarjetas de reporte (`PerformanceCard`, `MetaTagsCard`,
`StructureCard`) + `ScoreGauge`.

Todo el trabajo "sensible" (peticiones HTTP salientes, parsing de HTML,
cálculo del score) ocurre **exclusivamente en el servidor**, dentro de una
Server Action marcada con `'use server'`. El cliente nunca ve ni ejecuta
`axios` ni `cheerio`: solo envía un string (la URL) y recibe de vuelta un
objeto JSON ya procesado. Esto reduce el tamaño del bundle de JavaScript
que llega al navegador y evita exponer lógica de scraping en el cliente.

---

## 1. `package.json`

**Qué hace:** declara el nombre del proyecto, los scripts de npm
(`dev`, `build`, `start`, `lint`) y las dependencias exactas que hacen
falta para que el proyecto compile y funcione.

**Cómo lo hace:** separa `dependencies` (lo que se necesita en producción:
Next.js, React, axios, cheerio, lucide-react) de `devDependencies` (lo que
solo hace falta durante el desarrollo/build: Tailwind, PostCSS, ESLint).
También fija un rango mínimo de Node.js en `engines`.

**Por qué se hace así:** separar dependencias de producción y de
desarrollo mantiene ligero el árbol de dependencias que realmente viaja a
un entorno de despliegue. Fijar `engines.node` documenta explícitamente el
requisito de versión, evitando errores confusos en máquinas con Node
desactualizado.

**Ejemplo de código real:**
```json
"dependencies": {
  "axios": "^1.7.7",
  "cheerio": "^1.0.0",
  "lucide-react": "^0.446.0",
  "next": "14.2.35",
  "react": "^18.3.1",
  "react-dom": "^18.3.1"
}
```

---

## 2. `next.config.mjs`

**Qué hace:** configura el comportamiento del framework Next.js para este
proyecto en particular.

**Cómo lo hace:** activa `reactStrictMode` (ayuda a detectar efectos
secundarios inseguros durante el desarrollo) y amplía el límite de tamaño
de body permitido en las Server Actions (`serverActions.bodySizeLimit`),
ya que algunas páginas HTML descargadas para análisis pueden ser
voluminosas.

**Por qué se hace así:** el límite por defecto de Next.js para las Server
Actions es conservador; como esta app transporta HTML completo entre el
servidor y su propia lógica interna, subir ese límite evita cortes
inesperados en sitios con documentos HTML grandes (por ejemplo, páginas de
comercio electrónico con mucho markup).

**Ejemplo de código real:**
```javascript
experimental: {
  serverActions: {
    bodySizeLimit: '4mb',
  },
},
```

---

## 3. `tailwind.config.js`

**Qué hace:** define el sistema de diseño (colores, tipografías,
animaciones) que Tailwind CSS pondrá a disposición de toda la aplicación
como clases utilitarias.

**Cómo lo hace:** extiende el tema por defecto de Tailwind con una paleta
personalizada de "panel de diagnóstico" (`ink` para fondos oscuros, `mist`
para textos, `signal` como único acento vivo en ámbar, y `health` para los
tres estados semánticos: bien / advertencia / error). También declara las
familias tipográficas (`display`, `body`) enlazadas a variables CSS que
inyectan las fuentes de Google, y dos animaciones (`scan`, `pulseDot`)
usadas exclusivamente en el estado de carga.

**Por qué se hace así:** centralizar la paleta en `tailwind.config.js` (en
vez de escribir códigos de color sueltos por todo el código) evita
inconsistencias visuales y hace trivial ajustar el tono de toda la app
desde un único lugar. Se evitó deliberadamente la combinación "fondo casi
negro + un único verde ácido" por ser el patrón visual más genérico para
apps generadas por IA; en su lugar se usa un azul-tinta profundo con un
ámbar cálido como acento, coherente con la idea de "instrumento de
diagnóstico".

**Ejemplo de código real:**
```javascript
colors: {
  ink: { 950: '#0B0E14', 900: '#12151C', /* ... */ },
  signal: { DEFAULT: '#F0A93C', soft: '#F0A93C1A', dim: '#C4842A' },
  health: { good: '#3DDC97', warn: '#F0A93C', bad: '#E8574D' },
},
```

---

## 4. `postcss.config.js`

**Qué hace:** le indica a PostCSS (el procesador de CSS que usa Next.js
internamente) que ejecute dos plugins: `tailwindcss` (para expandir las
clases utilitarias) y `autoprefixer` (para añadir prefijos de proveedor
como `-webkit-` automáticamente).

**Cómo lo hace:** es un archivo de configuración plano; no contiene
lógica propia, solo declara qué plugins usar.

**Por qué se hace así:** es la configuración estándar y mínima necesaria
para que Tailwind CSS funcione dentro de un proyecto Next.js; separar esta
configuración de `tailwind.config.js` sigue la convención del propio
ecosistema PostCSS.

**Ejemplo de código real:**
```javascript
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

---

## 5. `jsconfig.json`

**Qué hace:** habilita el alias de importación `@/` para que apunte a la
raíz del proyecto.

**Cómo lo hace:** define `baseUrl` y un mapeo en `paths` que traduce
`@/lib/...` o `@/components/...` a las rutas reales del sistema de
archivos.

**Por qué se hace así:** sin este alias, importar un módulo profundamente
anidado obligaría a escribir rutas relativas frágiles como
`../../../lib/scoring`. Con el alias, cualquier archivo puede importar de
forma absoluta y estable sin importar en qué carpeta se encuentre.

**Ejemplo de código real:**
```json
"paths": { "@/*": ["./*"] }
```
Esto permite, en cualquier componente:
```javascript
import { validateUrl } from '@/lib/validators';
```

---

## 6. `.gitignore`

**Qué hace:** le dice a Git qué archivos y carpetas no debe versionar.

**Cómo lo hace:** excluye `node_modules` (dependencias reinstalables vía
`npm install`), `.next` (artefactos de compilación), variables de entorno
(`.env*`), logs, archivos de sistema operativo (`.DS_Store`) y carpetas de
editores.

**Por qué se hace así:** versionar `node_modules` o `.next` infla el
repositorio innecesariamente y genera conflictos de merge sin ningún
beneficio, ya que ambos se regeneran automáticamente con `npm install` y
`npm run build` respectivamente. Ignorar `.env*` es además una práctica de
seguridad básica para no filtrar credenciales por accidente.

**Ejemplo de código real:**
```
/node_modules
/.next/
.env
.env.local
```

---

## 7. `app/layout.js`

**Qué hace:** es el layout raíz de la aplicación en el App Router de
Next.js. Envuelve **todas** las páginas (en este proyecto solo hay una,
`app/page.js`) y define la estructura `<html>`/`<body>`, las fuentes y los
metadatos SEO de la propia aplicación SiteAuditor.

**Cómo lo hace:** usa `next/font/google` para cargar las tipografías
**Sora** (titulares) e **Inter** (cuerpo de texto) de forma optimizada:
Next.js las descarga en tiempo de build, las auto-hospeda y expone su
`className`/variable CSS, evitando el parpadeo de fuente típico de cargar
Google Fonts vía `<link>` en tiempo de ejecución. El objeto `metadata`
exportado alimenta las etiquetas `<title>` y `<meta name="description">`
de la propia app.

**Por qué se hace así:** `next/font` es la forma recomendada por Next.js
de trabajar con tipografías externas porque elimina peticiones de red
adicionales en el navegador del usuario final y previene el "layout
shift" causado por la carga tardía de fuentes. Separar Sora (display) de
Inter (cuerpo) sigue la guía de usar como máximo dos familias claramente
distintas: una con personalidad para titulares, otra optimizada para
lectura en tamaños pequeños.

**Ejemplo de código real:**
```javascript
const sora = Sora({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});
```

---

## 8. `app/globals.css`

**Qué hace:** define los estilos globales de la aplicación: las tres
capas de Tailwind (`base`, `components`, `utilities`), el fondo con
gradientes radiales sutiles, el estilo de foco de teclado y la animación
de "línea de escaneo" usada en el estado de carga.

**Cómo lo hace:** usa las directivas `@tailwind` para inyectar las clases
utilitarias de Tailwind, y las capas `@layer base` / `@layer components`
para añadir estilos personalizados sin romper el orden de especificidad
de Tailwind. También incluye una media query `prefers-reduced-motion` que
desactiva las animaciones para usuarios que así lo han configurado en su
sistema operativo.

**Por qué se hace así:** declarar el foco de teclado (`:focus-visible`)
de forma global garantiza accesibilidad consistente en todos los
elementos interactivos sin tener que repetirlo en cada componente.
Respetar `prefers-reduced-motion` es una práctica de accesibilidad
estándar que evita causar molestias a usuarios sensibles al movimiento.

**Ejemplo de código real:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

---

## 9. `app/page.js`

**Qué hace:** es la única página de la aplicación. Orquesta todo el flujo
visible para el usuario: renderiza el formulario, gestiona el estado de
carga, muestra errores y, cuando el análisis termina con éxito, renderiza
el reporte completo (gauge de puntuación + las tres tarjetas de
categoría).

**Cómo lo hace:** es un **client component** (`'use client'`) porque
necesita `useState` y manejadores de evento. Usa `useTransition` de React
para envolver la llamada a la Server Action `runAudit`: esto le da de
forma nativa una bandera `isPending` sin tener que gestionar manualmente
un `try/finally` con `setIsLoading(true/false)`. El resultado se guarda en
tres piezas de estado: `report` (los datos del análisis), `errorMessage`
(si algo falla) y `analyzedUrl` (para mostrar qué URL se analizó).

**Por qué se hace así:** `useTransition` es el patrón recomendado por
React para acciones asíncronas disparadas desde el cliente que actualizan
la UI de forma no bloqueante; evita que la interfaz se congele mientras
la petición está en curso y simplifica el manejo del estado de carga
comparado con gestionar banderas booleanas a mano. Mantener `page.js`
como un orquestador delgado (sin lógica de negocio) y delegar cada bloque
visual a un componente especializado sigue el principio de
responsabilidad única y hace el archivo fácil de leer de arriba a abajo.

**Ejemplo de código real:**
```javascript
function handleAnalyze(url) {
  setErrorMessage(null);
  setAnalyzedUrl(url);

  startTransition(async () => {
    const result = await runAudit(url);
    if (!result.success) {
      setReport(null);
      setErrorMessage(result.error);
      return;
    }
    setReport(result.data);
  });
}
```

---

## 10. `app/actions/analyze.js`

**Qué hace:** es la **Server Action** que actúa como frontera entre el
cliente y toda la lógica de negocio del servidor. Recibe la URL cruda que
escribió el usuario y devuelve un objeto homogéneo `{ success, data? ,
error? }`.

**Cómo lo hace:** la directiva `'use server'` en la primera línea le dice
a Next.js que esta función (y todo lo que importa) debe ejecutarse
exclusivamente en el servidor y exponerse al cliente como un endpoint
invocable, sin incluir su código fuente en el bundle de JavaScript del
navegador. Internamente encadena tres pasos puros: `validateUrl` →
`analyzeUrl` → `computeHealthScore`, cortando el flujo en cuanto alguno
falla.

**Por qué se hace así:** usar una Server Action en lugar de un Route
Handler (`app/api/.../route.js`) tradicional simplifica el contrato:
`page.js` importa `runAudit` y lo llama como una función asíncrona normal,
sin tener que construir manualmente un `fetch('/api/analyze')`, serializar
un `body` JSON, ni parsear la respuesta. Next.js gestiona esa
comunicación por debajo. Repartir el trabajo en tres módulos
independientes (`validators`, `analyzer`, `scoring`) en vez de meter todo
en este archivo permite testear y razonar sobre cada responsabilidad por
separado.

**Ejemplo de código real:**
```javascript
'use server';

export async function runAudit(rawUrl) {
  const { valid, url, reason } = validateUrl(rawUrl);
  if (!valid) return { success: false, error: reason };

  const raw = await analyzeUrl(url);
  if (raw.error) return { success: false, error: raw.error };

  const { score, issues } = computeHealthScore(raw);
  return { success: true, data: { ...raw, score, issues } };
}
```

---

## 11. `lib/validators.js`

**Qué hace:** valida y normaliza la URL introducida por el usuario, tanto
en el cliente (para dar feedback instantáneo) como en el servidor (como
última línea de defensa antes de hacer una petición HTTP real).

**Cómo lo hace:** `normalizeUrl` antepone `https://` si el usuario no
escribió un protocolo. `validateUrl` construye un objeto `URL` nativo del
navegador/Node (que lanza una excepción si el formato es inválido),
comprueba que el protocolo sea `http` o `https`, y valida con una
expresión regular simple que el nombre de host tenga al menos un punto y
una extensión de dos o más letras (para descartar cosas como
`https://localhost` en el flujo público).

**Por qué se hace así:** exportar funciones puras (sin efectos
secundarios, mismas entradas → mismas salidas) permite reutilizarlas tal
cual tanto en `UrlForm.js` (cliente) como en `analyze.js` (servidor) sin
duplicar la lógica de validación, que es exactamente el mismo objeto
`{ valid, url, reason }` en ambos lados. Nunca se confía únicamente en la
validación del cliente porque un usuario malicioso podría saltarse la UI
e invocar la Server Action directamente.

**Ejemplo de código real:**
```javascript
export function normalizeUrl(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
```

---

## 12. `lib/analyzer.js`

**Qué hace:** es el motor de extracción de datos: dada una URL ya
validada, hace la petición HTTP, mide su latencia y extrae del HTML todo
lo que las tarjetas del reporte necesitan (metaetiquetas, encabezados,
imágenes).

**Cómo lo hace:**
1. Guarda `Date.now()` antes de la petición y vuelve a medirlo justo
   después de recibir la respuesta, para calcular la latencia real en
   milisegundos.
2. Usa `axios.get` con `validateStatus: () => true` para que **cualquier**
   código de estado (incluidos 404 o 500) se trate como una respuesta
   válida en vez de lanzar una excepción, de forma que la app pueda
   reportar ese código como un hallazgo en vez de romperse.
3. Fija un `timeout` de 10 segundos, un límite de redirecciones y un
   límite de tamaño de respuesta (`maxContentLength`) para protegerse de
   sitios lentos, bucles de redirección o respuestas anómalamente
   pesadas.
4. Carga el HTML resultante en `cheerio.load(html)`, que ofrece una API
   de selección de nodos idéntica a jQuery para recorrer el DOM en el
   servidor sin necesidad de un navegador real.
5. Extrae cada dato con selectores CSS: `$('title').first().text()` para
   el título, `$('meta[name="description"]').attr('content')` para la
   descripción, etc.
6. Si la petición falla por completo (timeout, DNS, conexión rechazada),
   `buildFailureResult` construye una respuesta homogénea con un mensaje
   de error legible en español en vez de dejar que la excepción se
   propague sin control.

**Por qué se hace así:** `cheerio` se eligió (tal como pedía el brief) en
vez de un navegador headless (Puppeteer/Playwright) porque para auditar
metaetiquetas y estructura del HTML servido por el servidor no hace falta
ejecutar JavaScript ni renderizar la página visualmente: `cheerio` es
mucho más ligero y rápido, y no requiere instalar un binario de Chromium.
`validateStatus: () => true` es clave para el propósito de la app: un
código 404 o 500 **es en sí mismo** un hallazgo de la auditoría, no un
error del programa. Separar `buildFailureResult` como función aparte
evita repetir la construcción del objeto de respuesta en cada rama de
error.

**Ejemplo de código real:**
```javascript
response = await axios.get(url, {
  timeout: REQUEST_TIMEOUT_MS,
  maxRedirects: MAX_REDIRECTS,
  validateStatus: () => true,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; SiteAuditorBot/1.0; ...)',
  },
});
```
```javascript
const meta = {
  title: $('title').first().text().trim() || null,
  description: readMeta($, 'meta[name="description"]'),
  canonical: $('link[rel="canonical"]').attr('href') || null,
};
```

---

## 13. `lib/scoring.js`

**Qué hace:** convierte los datos crudos del análisis en (a) una lista de
"issues" (hallazgos, con severidad y categoría) y (b) una puntuación
global de 0 a 100 (el Health Score).

**Cómo lo hace:** define un diccionario `WEIGHTS` con la penalización
exacta de cada problema posible (por ejemplo, `TITLE_MISSING: 15`,
`SLOW_RESPONSE: 10`). Tres funciones internas (`scorePerformance`,
`scoreMetaTags`, `scoreStructure`) revisan cada bloque de datos, empujan
penalizaciones al array `deductions` y generan un `issue()` (con severidad
`success` | `warning` | `error`) por cada comprobación, tanto si pasó como
si falló. `computeHealthScore` suma todas las deducciones, resta el total
de 100 y acota el resultado entre 0 y 100 con `clamp()`.

**Por qué se hace así:** separar el "qué encontramos" (`analyzer.js`) del
"qué significa lo que encontramos" (`scoring.js`) permite que el algoritmo
de puntuación se pueda ajustar, testear o incluso sustituir sin tocar ni
una línea de la lógica de red/parsing. Generar un `issue` por cada
comprobación —incluidas las que pasan— permite que la UI muestre tanto lo
que está bien como lo que falta, en vez de solo una lista de errores.
Ordenar los issues por severidad (`error` → `warning` → `success`) asegura
que el usuario vea primero lo más urgente, sin depender del orden en que
cheerio devolvió los nodos.

**Ejemplo de código real:**
```javascript
const WEIGHTS = {
  TITLE_MISSING: 15,
  DESCRIPTION_MISSING: 15,
  H1_MISSING: 10,
  SLOW_RESPONSE: 10,
  VERY_SLOW_RESPONSE: 20,
};
```
```javascript
const totalDeduction = deductions.reduce((sum, value) => sum + value, 0);
const score = clamp(Math.round(100 - totalDeduction), 0, 100);
```

---

## 14. `components/UrlForm.js`

**Qué hace:** el formulario controlado donde el usuario escribe la URL a
auditar.

**Cómo lo hace:** mantiene el valor del input en estado local (`useState`)
y reutiliza `validateUrl` de `lib/validators.js` para mostrar un mensaje de
error en tiempo real una vez que el campo ha sido "tocado" (`touched`). Al
enviar el formulario, vuelve a validar y, si es válido, llama a la prop
`onSubmit(url)` que le pasó `page.js`. El botón se deshabilita mientras
`isLoading` es verdadero y cambia su texto a "Analizando…".

**Por qué se hace así:** es un componente deliberadamente "tonto": no
sabe nada de Server Actions, axios ni cheerio, solo recoge un string y se
lo entrega a quien lo use. Esto lo hace reutilizable y fácil de testear en
aislamiento. Mostrar el error solo después de que el campo fue tocado
(`touched`) evita mostrar un mensaje de "URL inválida" nada más cargar la
página, antes de que el usuario haya escrito nada.

**Ejemplo de código real:**
```javascript
const validation = touched ? validateUrl(value) : { valid: true };
const showError = touched && !validation.valid && value.trim() !== '';
```

---

## 15. `components/LoadingState.js`

**Qué hace:** muestra el estado de carga dinámico ("Analizando sitio
web…") mientras la Server Action está en curso.

**Cómo lo hace:** es un componente puramente presentacional (no gestiona
temporizadores propios): `page.js` decide cuándo mostrarlo según su
bandera `isPending`. Incluye una barra con una animación de "línea de
escaneo" (`animate-scan`, definida en `tailwind.config.js`) y usa
`role="status"` + `aria-live="polite"` para que lectores de pantalla
anuncien el cambio de estado automáticamente.

**Por qué se hace así:** separar el estado de carga en su propio
componente mantiene `page.js` legible y permite reutilizar o modificar la
animación sin tocar la lógica de orquestación. Los atributos ARIA
convierten un elemento puramente visual en información accesible también
para quienes usan tecnología de asistencia.

**Ejemplo de código real:**
```javascript
<div role="status" aria-live="polite" className="...">
  <p className="font-display text-base font-semibold text-mist-100">{label}</p>
</div>
```

---

## 16. `components/ScoreGauge.js`

**Qué hace:** dibuja el dial circular que representa visualmente el
Health Score (0-100), coloreado según su rango.

**Cómo lo hace:** dibuja dos `<circle>` SVG superpuestos: uno gris como
"pista" de fondo y otro coloreado que representa el progreso real,
usando la técnica clásica de `stroke-dasharray` (longitud total de la
circunferencia) y `stroke-dashoffset` (cuánto de esa longitud queda
"oculto"). La función `toneFor(score)` decide el color (verde ≥ 80, ámbar
50-79, rojo < 50) y la etiqueta textual asociada.

**Por qué se hace así:** se construyó a mano con SVG nativo, sin depender
de una librería externa de gráficos, porque el requisito es muy concreto
(un único dial circular) y no justifica añadir peso de bundle para ese
propósito. Concentrar aquí el único color "vivo" de toda la interfaz (el
resto de la app usa tonos neutros de tinta) hace que el score sea, a
propósito, el elemento visualmente más importante del reporte.

**Ejemplo de código real:**
```javascript
const offset = CIRCUMFERENCE - (clampScore(score) / 100) * CIRCUMFERENCE;
// ...
<circle
  strokeDasharray={CIRCUMFERENCE}
  strokeDashoffset={offset}
  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
/>
```

---

## 17. `components/StatusBadge.js`

**Qué hace:** centraliza el mapeo entre una severidad (`success` |
`warning` | `error`) y su icono + color correspondiente, para usarlo en
cualquier parte de la app.

**Cómo lo hace:** un objeto `SEVERITY_MAP` asocia cada severidad a un
icono de `lucide-react` (`CheckCircle2`, `AlertTriangle`, `XCircle`) y una
clase de color de Tailwind. El componente simplemente busca la entrada
correspondiente y renderiza el icono.

**Por qué se hace así:** sin esta centralización, cada tarjeta del reporte
tendría que decidir por su cuenta "qué color es un error", con el riesgo
de que una tarjeta use rojo y otra naranja para el mismo concepto. Al
tener un único punto de verdad, "rojo siempre significa error" en toda la
aplicación de forma garantizada.

**Ejemplo de código real:**
```javascript
const SEVERITY_MAP = {
  success: { Icon: CheckCircle2, className: 'text-health-good' },
  warning: { Icon: AlertTriangle, className: 'text-health-warn' },
  error: { Icon: XCircle, className: 'text-health-bad' },
};
```

---

## 18. `components/ReportCard.js`

**Qué hace:** contenedor visual genérico y reutilizable para cada bloque
del reporte (Rendimiento, Metaetiquetas, Estructura HTML).

**Cómo lo hace:** recibe un icono, un título, un color de acento y el
contenido (`children`) de la tarjeta. También exporta la función auxiliar
`worstSeverityColor(issues)`, que recorre los issues de una categoría y
devuelve el color correspondiente a la peor severidad encontrada (rojo si
hay algún error, ámbar si solo hay advertencias, verde si todo está bien).

**Por qué se hace así:** en vez de que las tres tarjetas del reporte
luzcan exactamente igual (mismo borde redondeado, misma sombra genérica),
cada una lleva un **borde izquierdo de color** que resume de un vistazo su
estado interno, funcionando como una franja de estado con significado en
vez de una decoración repetida sin propósito.

**Ejemplo de código real:**
```javascript
export function worstSeverityColor(issues) {
  if (issues.some((item) => item.severity === 'error')) return '#E8574D';
  if (issues.some((item) => item.severity === 'warning')) return '#F0A93C';
  return '#3DDC97';
}
```

---

## 19. `components/IssueList.js`

**Qué hace:** renderiza la lista de hallazgos de una categoría concreta
dentro de una tarjeta (icono de severidad + mensaje + detalle opcional).

**Cómo lo hace:** recibe un array `issues` ya filtrado por categoría y lo
recorre con `.map()`, delegando el icono a `StatusBadge`.

**Por qué se hace así:** las tres tarjetas de categoría
(`PerformanceCard`, `MetaTagsCard`, `StructureCard`) necesitan mostrar
exactamente el mismo tipo de lista; extraer este marcado a un componente
compartido evita triplicar el mismo JSX y centraliza cualquier cambio
futuro en el formato de un hallazgo.

**Ejemplo de código real:**
```javascript
{issues.map((item, index) => (
  <li key={index} className="flex gap-2.5">
    <StatusBadge severity={item.severity} className="mt-0.5" />
    <div>
      <p className="text-sm leading-snug text-mist-100">{item.message}</p>
      {item.detail && <p className="mt-0.5 text-xs text-mist-400">{item.detail}</p>}
    </div>
  </li>
))}
```

---

## 20. `components/PerformanceCard.js`

**Qué hace:** muestra el bloque de "Rendimiento": la latencia medida, el
código de estado HTTP y los issues asociados a esa categoría.

**Cómo lo hace:** filtra `issues` por `category === 'rendimiento'` y
renderiza dos métricas destacadas (latencia y código de estado) más la
lista de hallazgos, todo envuelto en `ReportCard`.

**Por qué se hace así:** cada tarjeta de categoría filtra su propio
subconjunto de `issues` en vez de que `page.js` los reparta manualmente;
esto mantiene a `page.js` desacoplado del detalle de cada categoría y hace
que añadir una categoría nueva en el futuro no requiera tocar el
orquestador principal.

**Ejemplo de código real:**
```javascript
const categoryIssues = issues.filter((item) => item.category === 'rendimiento');
// ...
<Metric label="Latencia" value={`${timing.ms} ms`} />
<Metric label="Código de estado" value={String(timing.status)} />
```

---

## 21. `components/MetaTagsCard.js`

**Qué hace:** muestra el bloque de "Metaetiquetas": los valores crudos
extraídos (title, description, canonical, robots, Open Graph) y los
issues de esa categoría.

**Cómo lo hace:** un subcomponente interno `Field` renderiza cada valor
con una etiqueta y, si el valor es `null` (no encontrado en el HTML),
muestra "No encontrado" en cursiva en vez de dejar un hueco vacío.

**Por qué se hace así:** mostrar explícitamente "No encontrado" en vez de
un campo en blanco evita que el usuario piense que la aplicación falló al
leer el dato, dejando claro que el HTML del sitio auditado simplemente no
incluye esa etiqueta.

**Ejemplo de código real:**
```javascript
<p className={`... ${value ? 'text-mist-100' : 'italic text-mist-400'}`}>
  {value || 'No encontrado'}
</p>
```

---

## 22. `components/StructureCard.js`

**Qué hace:** muestra el bloque de "Estructura HTML": conteo de
encabezados H1/H2/H3, una muestra del contenido del H1, el total de
imágenes y cuántas carecen de atributo `alt`.

**Cómo lo hace:** un subcomponente `HeadingCount` repite el mismo patrón
visual (número grande + etiqueta) para cada nivel de encabezado. El
contador de imágenes sin `alt` cambia de color (ámbar si es mayor que
cero, verde si es cero) para comunicar el estado de un vistazo.

**Por qué se hace así:** presentar los tres niveles de encabezado en
paralelo (en vez de solo listar el total) permite al usuario detectar
visualmente problemas de jerarquía (por ejemplo, muchos H3 y cero H2) sin
tener que leer el texto de los issues.

**Ejemplo de código real:**
```javascript
<p className={`... ${images.missingAlt > 0 ? 'text-health-warn' : 'text-health-good'}`}>
  {images.missingAlt}
</p>
```

---

## 23. `components/EmptyState.js`

**Qué hace:** se muestra antes de que el usuario haya ejecutado ninguna
auditoría, explicando qué debe hacer a continuación.

**Cómo lo hace:** es un bloque estático con un icono y dos líneas de
texto instructivo.

**Por qué se hace así:** siguiendo la idea de tratar la vacuidad como una
invitación a actuar, este estado no se limita a mostrar un hueco en
blanco: le dice explícitamente al usuario qué botón pulsar y qué va a
obtener a cambio.

**Ejemplo de código real:**
```javascript
<p className="mx-auto max-w-sm text-sm text-mist-400">
  Escribe una URL arriba y pulsa &quot;Auditar sitio&quot; para revisar su
  rendimiento, metaetiquetas y estructura HTML en segundos.
</p>
```

---

## Resumen de decisiones de arquitectura clave

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Server Action para el análisis | Route Handler (`/api/analyze`) | Menos código repetitivo de `fetch`/JSON; Next.js gestiona la comunicación cliente-servidor automáticamente |
| `cheerio` para parsear HTML | Puppeteer/Playwright (navegador headless) | No se necesita ejecutar JavaScript de la página; `cheerio` es órdenes de magnitud más ligero y rápido |
| `validateStatus: () => true` en axios | Dejar que axios lance excepción en 4xx/5xx | Un código de error HTTP es en sí mismo un hallazgo de la auditoría, no un fallo del programa |
| Módulos separados `analyzer` / `scoring` | Todo en un único archivo | Permite testear el algoritmo de puntuación sin red y ajustar los pesos sin tocar el scraping |
| SVG hecho a mano para el gauge | Librería de gráficos (Chart.js, Recharts) | El requisito es un único dial; no justifica el peso de una dependencia externa |
