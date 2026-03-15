export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  safelist: [
    'bg-theme',
    'text-theme',
    'border-theme',
    'opacity-15',
    '-left-[7px]',
    'inset-[9%]',
    'tracking-[0.32em]',
    'shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
    'shadow-[0_2px_10px_rgba(15,23,42,0.02)]',
    'shadow-[0_4px_12px_rgba(16,185,129,0.1)]',
    'shadow-[0_4px_16px_rgba(15,23,42,0.04)]',
    'shadow-[0_20px_60px_rgba(15,23,42,0.08)]',
    'shadow-[0_0_40px_rgba(0,0,0,0.3)]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]',
    'group-hover/icon:scale-105',
    'group-hover/stage:opacity-30'
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
