import { RadarIcon } from 'lucide-react';

/**
 * components/LoadingState.js
 *
 * Estado de carga dinámico mostrado mientras la Server Action está en
 * vuelo. Es un componente puramente presentacional: no gestiona
 * temporizadores ni estado propio, solo se muestra u oculta según la
 * prop `isLoading` en app/page.js. La animación (línea de escaneo) es
 * el único elemento con movimiento no disparado por el usuario en
 * toda la app, coherente con el principio de usar el movimiento con
 * moderación.
 */
export default function LoadingState({ label = 'Analizando sitio web…' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-5 rounded-2xl border border-ink-600 bg-ink-800/60 px-6 py-14 text-center"
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-signal/30 bg-signal/10">
        <RadarIcon className="h-7 w-7 text-signal" aria-hidden="true" />
        <span className="absolute inset-0 animate-pulseDot rounded-full border border-signal/40" />
      </div>

      <div className="space-y-1.5">
        <p className="font-display text-base font-semibold text-mist-100">{label}</p>
        <p className="text-sm text-mist-300">
          Midiendo latencia, leyendo metaetiquetas y revisando la estructura HTML.
        </p>
      </div>

      <div className="h-1 w-56 overflow-hidden rounded-full bg-ink-700">
        <div className="scanline-border h-full w-full animate-scan" />
      </div>
    </div>
  );
}
