import StatusBadge from './StatusBadge';

/**
 * components/IssueList.js
 *
 * Lista de hallazgos (issues) de una categoría concreta. Se reutiliza
 * en PerformanceCard, MetaTagsCard y StructureCard para no duplicar el
 * marcado de "icono + mensaje + detalle" tres veces.
 */
export default function IssueList({ issues }) {
  if (issues.length === 0) {
    return <p className="text-sm text-mist-400">Sin hallazgos en esta categoría.</p>;
  }

  return (
    <ul className="space-y-3">
      {issues.map((item, index) => (
        <li key={index} className="flex gap-2.5">
          <StatusBadge severity={item.severity} className="mt-0.5" />
          <div>
            <p className="text-sm leading-snug text-mist-100">{item.message}</p>
            {item.detail && <p className="mt-0.5 text-xs leading-snug text-mist-400">{item.detail}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
