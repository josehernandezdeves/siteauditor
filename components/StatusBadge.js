import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

/**
 * components/StatusBadge.js
 *
 * Icono + color coherente para representar la severidad de un hallazgo
 * (success | warning | error) en cualquier parte de la app. Centralizar
 * este mapeo evita que cada tarjeta reinvente sus propios colores y
 * garantiza que "verde siempre significa éxito" en toda la interfaz.
 */

const SEVERITY_MAP = {
  success: {
    Icon: CheckCircle2,
    className: 'text-health-good',
  },
  warning: {
    Icon: AlertTriangle,
    className: 'text-health-warn',
  },
  error: {
    Icon: XCircle,
    className: 'text-health-bad',
  },
};

export default function StatusBadge({ severity = 'success', className = '' }) {
  const config = SEVERITY_MAP[severity] || SEVERITY_MAP.success;
  const { Icon } = config;

  return (
    <Icon
      className={`h-4 w-4 shrink-0 ${config.className} ${className}`}
      aria-hidden="true"
    />
  );
}

export function severityLabel(severity) {
  if (severity === 'error') return 'Error';
  if (severity === 'warning') return 'Advertencia';
  return 'Correcto';
}
