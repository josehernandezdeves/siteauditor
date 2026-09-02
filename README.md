# SiteAuditor

Herramienta de auditoría SEO on-page y rendimiento web. Introduces una URL,
la aplicación mide su latencia, analiza sus metaetiquetas y su estructura
HTML, y devuelve un **Health Score** de 0 a 100 junto con recomendaciones
concretas de mejora.

Construida con **Next.js 14 (App Router)**, **React 18**, **Tailwind CSS**,
**axios** y **cheerio**. Sin base de datos, sin autenticación: cada análisis
se ejecuta bajo demanda en el servidor a través de una **Server Action**.

---

## 1. Requisitos previos

- **Node.js 18.17 o superior** (recomendado 20 LTS). Compruébalo con:
  ```bash
  node -v
  ```
- **npm** (viene incluido con Node.js). También funciona con `yarn` o `pnpm`
  si lo prefieres; los comandos serían equivalentes.
- Conexión a internet: la aplicación necesita salir a la red para (a)
  analizar las URLs que le pidas y (b) descargar las tipografías de Google
  Fonts la primera vez que se compila.

## 2. Instalación

1. Descomprime el archivo `siteauditor.zip` en la carpeta donde quieras
   trabajar.
2. Abre una terminal dentro de la carpeta del proyecto:
   ```bash
   cd siteauditor
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```
   Esto instalará automáticamente, entre otras, las dependencias clave del
   proyecto:
   - `next`, `react`, `react-dom` — el framework y la librería de UI.
   - `axios` — cliente HTTP usado para descargar el HTML de la URL objetivo
     y medir su tiempo de respuesta.
   - `cheerio` — parser de HTML estilo jQuery usado para extraer
     metaetiquetas, encabezados e imágenes.
   - `lucide-react` — iconografía SVG ligera usada en toda la interfaz.
   - `tailwindcss`, `postcss`, `autoprefixer` — el sistema de estilos.

   Si por algún motivo quisieras instalarlas manualmente en un proyecto
   Next.js nuevo, el comando equivalente sería:
   ```bash
   npm install axios cheerio lucide-react
   ```

## 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador. Verás
el panel de SiteAuditor en modo oscuro con el campo para introducir una URL.

Prueba con cualquier sitio público, por ejemplo `wikipedia.org` o
`https://nextjs.org`. No hace falta escribir `https://`: si lo omites, la
aplicación lo antepone automáticamente.

## 4. Compilar para producción

```bash
npm run build
npm run start
```

`npm run build` genera una compilación optimizada en `.next/`. `npm run
start` levanta un servidor Node.js de producción sirviendo esa compilación
(por defecto también en el puerto 3000).

## 5. Estructura del proyecto

```
siteauditor/
├── app/
│   ├── actions/
│   │   └── analyze.js       # Server Action: orquesta validar → analizar → puntuar
│   ├── globals.css          # Estilos globales y capa Tailwind
│   ├── layout.js            # Layout raíz: fuentes, metadata, <html>/<body>
│   └── page.js              # Página principal (client component)
├── components/
│   ├── EmptyState.js
│   ├── IssueList.js
│   ├── LoadingState.js
│   ├── MetaTagsCard.js
│   ├── PerformanceCard.js
│   ├── ReportCard.js
│   ├── ScoreGauge.js
│   ├── StatusBadge.js
│   ├── StructureCard.js
│   └── UrlForm.js
├── lib/
│   ├── analyzer.js           # Fetch HTTP + parsing con cheerio
│   ├── scoring.js             # Algoritmo de puntuación e issues
│   └── validators.js          # Validación/normalización de URLs
├── .gitignore
├── jsconfig.json
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── README.md
```

Para una explicación detallada de **qué hace, cómo lo hace y por qué** cada
uno de estos archivos, consulta `DOCUMENTACION_TECNICA.md`, incluido en este
mismo paquete.

## 6. Notas y limitaciones conocidas

- El análisis solo audita el **HTML servido inicialmente** por el servidor
  (no ejecuta JavaScript del lado del cliente). Sitios que renderizan su
  contenido principal solo con JavaScript en el navegador (SPA sin SSR)
  mostrarán menos contenido del esperado en "Estructura HTML".
- Las peticiones tienen un tiempo límite de 10 segundos; si el sitio no
  responde a tiempo, se muestra un mensaje de error claro en lugar de
  colgar la interfaz.
- No se almacena ningún dato entre sesiones: cada auditoría vive únicamente
  en el estado de React mientras la pestaña permanece abierta.

## 7. Solución de problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `npm install` falla por versión de Node | Node < 18.17 | Actualiza Node.js (recomendado usar `nvm`) |
| Error al compilar por fuentes de Google | Sin conexión a internet durante el build | Verifica tu red; las fuentes se descargan solo en el primer build |
| "El dominio de la URL no parece válido" | Formato de URL incorrecto | Usa un dominio real, p. ej. `midominio.com` |
| El análisis tarda mucho o falla | El sitio de destino es muy lento o bloquea bots | Prueba con otra URL o revisa si el sitio bloquea el User-Agent |
