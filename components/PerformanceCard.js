import { Gauge } from 'lucide-react';
import ReportCard, { worstSeverityColor } from './ReportCard';
import IssueList from './IssueList';

/**
 * components/PerformanceCard.js
 *
 * Tarjeta de Rendimiento: muestra la latencia HTTP medida en
 * lib/analyzer.js y el código de estado, junto con los issues de la
 * categoría "rendimiento" generados por lib/scoring.js.
 */
export default function PerformanceCard({ timing, issues }) {
  const categoryIssues = issues.filter((item) => item.category === 'rendimiento');

  return (
    <ReportCard icon={Gauge} title="Rendimiento" accentColor={worstSeverityColor(categoryIssues)}>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Latencia" value={`${timing.ms} ms`} />
        <Metric label="Código de estado" value={String(timing.status)} />
      </div>
      <IssueList issues={categoryIssues} />
    </ReportCard>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-ink-600 bg-ink-900/60 px-3.5 py-3">
      <p className="text-xs text-mist-400">{label}</p>
      <p className="font-display text-lg font-semibold text-mist-100">{value}</p>
    </div>
  );
}
