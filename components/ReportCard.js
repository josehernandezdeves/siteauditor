/**
 * components/ReportCard.js
 *
 * Contenedor genérico para cada bloque del reporte (Rendimiento,
 * Metaetiquetas, Estructura HTML). Deliberadamente NO usa el patrón
 * "tarjeta redondeada con sombra suave idéntica" para las tres: en su
 * lugar, cada tarjeta lleva un borde izquierdo de color que resume su
 * peor severidad interna, funcionando como una franja de estado en
 * vez de una decoración repetida.
 */
export default function ReportCard({ icon: Icon, title, accentColor, children }) {
  return (
    <section
      className="rounded-2xl border border-ink-600 bg-ink-800/60 p-5 sm:p-6"
      style={{ borderLeftWidth: '3px', borderLeftColor: accentColor }}
    >
      <header className="mb-4 flex items-center gap-2.5">
        {Icon && <Icon className="h-5 w-5 text-mist-300" aria-hidden="true" />}
        <h3 className="font-display text-base font-semibold text-mist-100">{title}</h3>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/**
 * Determina el color de acento de una tarjeta según la peor
 * severidad presente entre sus issues (error > warning > success).
 */
export function worstSeverityColor(issues) {
  if (issues.some((item) => item.severity === 'error')) return '#E8574D';
  if (issues.some((item) => item.severity === 'warning')) return '#F0A93C';
  return '#3DDC97';
}
