/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El motor de análisis hace peticiones HTTP salientes a dominios arbitrarios
  // definidos por el usuario, por eso no restringimos "images.domains" ni usamos
  // <Image> de next/image para las capturas de OG: se muestran como <img> normal.
  experimental: {
    serverActions: {
      // Algunas páginas HTML son pesadas (temas, tiendas, etc.).
      // Se sube el límite por defecto para evitar cortes en la Server Action.
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;
