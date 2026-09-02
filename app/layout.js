import { Sora, Inter } from 'next/font/google';
import './globals.css';

// Sora para titulares: geométrica, técnica, con carácter propio (evita
// recurrir a la tipografía sans "de sistema" genérica en los encabezados).
const sora = Sora({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

// Inter para texto de lectura: alta legibilidad en tamaños pequeños,
// ideal para las métricas y descripciones densas del reporte.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'SiteAuditor — Auditoría SEO y rendimiento en segundos',
  description:
    'Introduce una URL y recibe un diagnóstico completo de SEO on-page, metaetiquetas, estructura HTML y tiempo de respuesta.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${sora.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-ink-950 font-body text-mist-100 antialiased">
        {children}
      </body>
    </html>
  );
}
