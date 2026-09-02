'use client';

import { useState, useTransition } from 'react';
import { ActivitySquare, AlertOctagon } from 'lucide-react';
import { runAudit } from './actions/analyze';
import UrlForm from '@/components/UrlForm';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import ScoreGauge from '@/components/ScoreGauge';
import PerformanceCard from '@/components/PerformanceCard';
import MetaTagsCard from '@/components/MetaTagsCard';
import StructureCard from '@/components/StructureCard';

/**
 * app/page.js
 *
 * Página raíz de SiteAuditor. Es un componente cliente porque necesita
 * estado interactivo (input controlado, estado de carga, resultado)
 * y porque invoca una Server Action desde manejadores de evento.
 *
 * El flujo es: UrlForm dispara handleAnalyze -> se llama a la Server
 * Action runAudit dentro de startTransition -> el resultado se guarda
 * en el estado local `report` (o `errorMessage` si falla) -> se
 * renderizan las tarjetas del reporte.
 *
 * useTransition se usa en vez de un simple `await` + setState manual
 * porque nos da `isPending` de forma nativa y mantiene la UI
 * respondiendo mientras la Server Action está en curso.
 */
export default function HomePage() {
  const [report, setReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [analyzedUrl, setAnalyzedUrl] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleAnalyze(url) {
    setErrorMessage(null);
    setAnalyzedUrl(url);

    startTransition(async () => {
      const result = await runAudit(url);

      if (!result.success) {
        setReport(null);
        setErrorMessage(result.error);
        return;
      }

      setReport(result.data);
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-14 sm:px-6">
      <header className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-signal/30 bg-signal/10">
          <ActivitySquare className="h-6 w-6 text-signal" aria-hidden="true" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-mist-100 sm:text-4xl">
          SiteAuditor
        </h1>
        <p className="mx-auto max-w-lg text-sm text-mist-300 sm:text-base">
          Introduce cualquier URL y obtén, en segundos, un diagnóstico de su salud SEO:
          rendimiento, metaetiquetas y estructura HTML.
        </p>
      </header>

      <UrlForm onSubmit={handleAnalyze} isLoading={isPending} />

      {isPending && <LoadingState />}

      {!isPending && errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-health-bad/40 bg-health-badSoft px-5 py-4">
          <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-health-bad" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-mist-100">No se pudo completar la auditoría</p>
            <p className="mt-0.5 text-sm text-mist-300">{errorMessage}</p>
          </div>
        </div>
      )}

      {!isPending && !errorMessage && !report && <EmptyState />}

      {!isPending && !errorMessage && report && (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-ink-600 bg-ink-800/60 px-6 py-8">
            <p className="max-w-full truncate text-sm text-mist-400" title={analyzedUrl}>
              {analyzedUrl}
            </p>
            <ScoreGauge score={report.score} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <PerformanceCard timing={report.timing} issues={report.issues} />
            <MetaTagsCard meta={report.meta} issues={report.issues} />
            <div className="sm:col-span-2">
              <StructureCard structure={report.structure} issues={report.issues} />
            </div>
          </div>
        </div>
      )}

      <footer className="pt-4 text-center text-xs text-mist-400">
        SiteAuditor analiza el HTML servido públicamente por la URL indicada. No requiere
        registro ni almacena resultados entre sesiones.
      </footer>
    </main>
  );
}
