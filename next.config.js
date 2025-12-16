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
    buildExcludes: [/middleware-manifest\.json$/],
    // Forzar actualización del service worker cambiando el nombre
    sw: 'sw.js',
    // Mejorar el manejo offline
    fallbacks: {
      document: '/offline', // Usar rewrite a /offline.html
    },
    // Importar el Service Worker personalizado después del generado
    // Esto carga el código de push notifications en el SW principal
    // IMPORTANTE: El listener de push debe registrarse de forma síncrona en sw-custom.js
    importScripts: ['/sw-custom.js'],
  },
  // Configuración de imágenes para permitir dominios externos
  images: {
    // Desactivar optimización para imágenes externas (más rápido y evita errores)
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Configuración adicional de optimización
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Permitir dominios sin restricciones para desarrollo
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
  // Rewrites para que /offline funcione correctamente
  async rewrites() {
    return [
      {
        source: '/offline',
        destination: '/offline.html',
      },
    ];
  },
  // Headers de seguridad mejorados
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
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Permitir acceso público a archivos estáticos del manifest
        source: '/img/favicons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Headers de seguridad para APIs
        source: '/api/:path*',
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
