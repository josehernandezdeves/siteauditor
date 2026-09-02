import { ListTree } from 'lucide-react';
import ReportCard, { worstSeverityColor } from './ReportCard';
import IssueList from './IssueList';

/**
 * components/StructureCard.js
 *
 * Tarjeta de Estructura HTML: resume el conteo de encabezados
 * (H1/H2/H3) y de imágenes con/sin atributo alt, junto con los
 * issues de la categoría "estructura".
 */
export default function StructureCard({ structure, issues }) {
  const categoryIssues = issues.filter((item) => item.category === 'estructura');
  const { headings, images } = structure;

  return (
    <ReportCard icon={ListTree} title="Estructura HTML" accentColor={worstSeverityColor(categoryIssues)}>
      <div className="grid grid-cols-3 gap-3">
        <HeadingCount label="H1" count={headings.h1.count} />
        <HeadingCount label="H2" count={headings.h2.count} />
        <HeadingCount label="H3" count={headings.h3.count} />
      </div>

      {headings.h1.samples.length > 0 && (
        <div className="rounded-xl border border-ink-600 bg-ink-900/60 px-3.5 py-2.5">
          <p className="text-xs text-mist-400">Contenido del H1</p>
          <p className="mt-0.5 truncate text-sm text-mist-100" title={headings.h1.samples[0]}>
            {headings.h1.samples[0]}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-ink-600 bg-ink-900/60 px-3.5 py-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-mist-400">Imágenes totales</p>
          <p className="font-display text-sm font-semibold text-mist-100">{images.total}</p>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-xs text-mist-400">Sin atributo alt</p>
          <p
            className={`font-display text-sm font-semibold ${
              images.missingAlt > 0 ? 'text-health-warn' : 'text-health-good'
            }`}
          >
            {images.missingAlt}
          </p>
        </div>
      </div>

      <IssueList issues={categoryIssues} />
    </ReportCard>
  );
}

function HeadingCount({ label, count }) {
  return (
    <div className="rounded-xl border border-ink-600 bg-ink-900/60 px-3 py-3 text-center">
      <p className="font-display text-xl font-semibold text-mist-100">{count}</p>
      <p className="text-xs text-mist-400">{label}</p>
    </div>
  );
}
