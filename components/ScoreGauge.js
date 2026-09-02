/**
 * components/ScoreGauge.js
 *
 * Dial circular construido a mano con SVG (sin librería de gráficos)
 * para representar el Health Score de 0 a 100. Es el elemento "hero"
 * del reporte: el único punto donde se concentra el color vivo
 * (ámbar/verde/rojo), mientras el resto del reporte permanece en
 * tonos neutros de tinta.
 *
 * El progreso se dibuja con la técnica de stroke-dasharray /
 * stroke-dashoffset sobre un <circle>, evitando dependencias externas.
 */

const SIZE = 168;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function toneFor(score) {
  if (score >= 80) return { color: '#3DDC97', label: 'Saludable' };
  if (score >= 50) return { color: '#F0A93C', label: 'Mejorable' };
  return { color: '#E8574D', label: 'Crítico' };
}

export default function ScoreGauge({ score }) {
  const { color, label } = toneFor(score);
  const offset = CIRCUMFERENCE - (clampScore(score) / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Puntuación de salud: ${score} de 100, ${label}`}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#1F2530"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold text-mist-100">{score}</span>
          <span className="text-xs text-mist-400">de 100</span>
        </div>
      </div>
      <span
        className="rounded-full px-3 py-1 text-sm font-semibold"
        style={{ color, backgroundColor: `${color}1A` }}
      >
        {label}
      </span>
    </div>
  );
}

function clampScore(score) {
  return Math.min(100, Math.max(0, score));
}
