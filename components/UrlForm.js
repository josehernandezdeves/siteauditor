'use client';

import { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { validateUrl } from '@/lib/validators';

/**
 * components/UrlForm.js
 *
 * Formulario controlado para introducir la URL a analizar.
 * Hace una validación optimista en el cliente (feedback inmediato,
 * sin esperar al servidor) pero la validación real y definitiva
 * ocurre igualmente en la Server Action, ya que nunca hay que confiar
 * en el cliente para reglas de negocio.
 *
 * Es un componente "tonto" en el sentido de que no sabe nada de
 * cheerio/axios: solo recoge el input y delega el envío al padre
 * mediante la prop onSubmit.
 */
export default function UrlForm({ onSubmit, isLoading }) {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const validation = touched ? validateUrl(value) : { valid: true };
  const showError = touched && !validation.valid && value.trim() !== '';

  function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    const result = validateUrl(value);
    if (!result.valid) return;
    onSubmit(result.url);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      <div
        className={`relative flex items-center gap-3 rounded-2xl border bg-ink-800/80 px-4 py-3.5 shadow-panel transition-colors ${
          showError ? 'border-health-bad/60' : 'border-ink-600 focus-within:border-signal/60'
        }`}
      >
        <Search className="h-5 w-5 shrink-0 text-mist-400" aria-hidden="true" />
        <input
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="ejemplo.com o https://ejemplo.com/pagina"
          value={value}
          disabled={isLoading}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={showError}
          aria-describedby={showError ? 'url-error' : undefined}
          className="w-full flex-1 bg-transparent font-body text-base text-mist-100 placeholder:text-mist-400 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || value.trim() === ''}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-signal px-4 py-2.5 font-display text-sm font-semibold text-ink-950 transition-transform enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? 'Analizando…' : 'Auditar sitio'}
          {!isLoading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <div className="mt-2 min-h-[1.25rem] px-1">
        {showError && (
          <p id="url-error" className="text-sm text-health-bad">
            {validation.reason}
          </p>
        )}
      </div>
    </form>
  );
}
