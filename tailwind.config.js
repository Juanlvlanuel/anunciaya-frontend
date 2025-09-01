// tailwind.config-1.js — limpia el warning de line-clamp (v3.3 ya lo incluye por defecto)
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  safelist: [
    // Mantengo la safelist por si usas line-clamp dinámico en runtime
    { pattern: /line-clamp-(1|2|3|4|5|6)/ },
  ],
  theme: {
    extend: {
      animation: {
        scroll: 'scroll 40s linear infinite',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  // Tailwind 3.3+ ya trae line-clamp por defecto, así que dejamos plugins vacío.
  plugins: [],
};
