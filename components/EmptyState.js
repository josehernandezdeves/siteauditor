import { ScanSearch } from 'lucide-react';

/**
 * components/EmptyState.js
 *
 * Estado inicial de la aplicación, antes de ejecutar cualquier
 * auditoría. Sigue el principio de tratar la vacuidad como una
 * invitación a actuar: explica qué va a pasar, no se limita a mostrar
 * un hueco en blanco.
 */
export default function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-ink-600 px-6 py-16 text-center">
      <ScanSearch className="h-8 w-8 text-mist-400" aria-hidden="true" />
      <div className="space-y-1.5">
        <p className="font-display text-base font-semibold text-mist-100">
          Todavía no hay ningún sitio auditado
        </p>
        <p className="mx-auto max-w-sm text-sm text-mist-400">
          Escribe una URL arriba y pulsa &quot;Auditar sitio&quot; para revisar su rendimiento,
          metaetiquetas y estructura HTML en segundos.
        </p>
      </div>
    </div>
  );
}
