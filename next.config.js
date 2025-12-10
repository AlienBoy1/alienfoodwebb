const withPWA = require("next-pwa");
const runtimeCaching = require('next-pwa/cache')

module.exports = withPWA({
  pwa: {
    // Desactivar PWA en desarrollo para evitar que GenerateSW se ejecute varias veces
    // y genere el warning durante HMR. Se activará en producción.
    disable: process.env.NODE_ENV !== "production",
    dest: "public",
    runtimeCaching,
    register: true,
    skipWaiting: true,
    // Mejorar el manejo offline
    fallbacks: {
      document: '/offline', // Página de fallback si no hay cache
    },
  },
  env: {
    stripe_public_key: process.env.STRIPE_PUBLIC_KEY,
  },
  // Mejorar el manejo de rutas dinámicas
  experimental: {
    optimizeCss: false,
  },
  // Mejorar compatibilidad con iOS/Safari
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Mejorar compatibilidad con navegadores antiguos
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Mejorar compatibilidad con Safari - proporcionar process
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
        })
      );
    }
    return config;
  },
  // Headers para mejorar compatibilidad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
});
