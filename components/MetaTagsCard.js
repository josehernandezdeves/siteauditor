import { Tags } from 'lucide-react';
import ReportCard, { worstSeverityColor } from './ReportCard';
import IssueList from './IssueList';

/**
 * components/MetaTagsCard.js
 *
 * Tarjeta de Metaetiquetas: expone los valores crudos extraídos por
 * cheerio (title, description, canonical, robots, Open Graph) además
 * de los issues de la categoría "metaetiquetas".
 */
export default function MetaTagsCard({ meta, issues }) {
  const categoryIssues = issues.filter((item) => item.category === 'metaetiquetas');

  return (
    <ReportCard icon={Tags} title="Metaetiquetas" accentColor={worstSeverityColor(categoryIssues)}>
      <div className="space-y-2.5">
        <Field label="Title" value={meta.title} />
        <Field label="Meta description" value={meta.description} />
        <Field label="Canonical" value={meta.canonical} mono />
        <Field label="Robots" value={meta.robots || 'index, follow (por defecto)'} />
        <Field label="og:title" value={meta.ogTitle} />
        <Field label="og:description" value={meta.ogDescription} />
        <Field label="og:image" value={meta.ogImage} mono />
      </div>
      <IssueList issues={categoryIssues} />
    </ReportCard>
  );
}

function Field({ label, value, mono = false }) {
  return (
    <div className="rounded-xl border border-ink-600 bg-ink-900/60 px-3.5 py-2.5">
      <p className="text-xs text-mist-400">{label}</p>
      <p
        className={`mt-0.5 truncate text-sm ${value ? 'text-mist-100' : 'italic text-mist-400'} ${mono ? 'font-mono text-[13px]' : ''}`}
        title={value || undefined}
      >
        {value || 'No encontrado'}
      </p>
    </div>
  );
}
