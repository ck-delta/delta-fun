/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Aileron', 'Geist Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', '"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Primitives (light/dark neutrals + colour ramps)
        wb:     { 50:'#EBECF0', 100:'#FFFFFF', 150:'#FBFCFD', 200:'#F3F4F6', 300:'#E6E9EF', 400:'#D7DDE7' },
        db:     { 50:'#0C0C0F', 100:'#111114', 150:'#18191E', 200:'#22242C', 300:'#2D303A', 400:'#353845' },
        grey:   { 100:'#FFFFFF', 150:'#E1E1E2', 200:'#CBCED2', 300:'#ADB1B7', 350:'#949AA3', 400:'#8E9298', 500:'#71747A', 600:'#44464A', 700:'#121214' },
        blue:   { 50:'#E6F2FD', 100:'#B2D6F8', 200:'#8CC2F4', 300:'#58A7F0', 400:'#3895ED', 500:'#067BE8', 600:'#0570D3', 700:'#0457A5', 800:'#034480', 900:'#033461', 1000:'#071624' },
        green:  { 50:'#E6F6F1', 100:'#D2EFE6', 200:'#8AD7C0', 300:'#54C5A3', 400:'#33B991', 500:'#00A876', 600:'#00996B', 700:'#007754', 800:'#005C41', 900:'#004732', 950:'#003224', 1000:'#162626' },
        yellow: { 50:'#FFF3CC', 100:'#FFF3CC', 200:'#FFE799', 300:'#FFDC66', 400:'#FFD64D', 500:'#FFD033', 600:'#FFC400', 700:'#DCAA05', 800:'#BA9109', 900:'#97770E', 950:'#745D12', 1000:'#3A3304' },
        orange: { 50:'#FFF0E6', 100:'#FFD1B1', 200:'#FFBB8B', 300:'#FE9D55', 400:'#FE8935', 500:'#FE6C02', 600:'#E76202', 700:'#A24B0D', 800:'#8C3B01', 900:'#592705', 1000:'#2F231B' },
        red:    { 50:'#FBEDED', 100:'#F8DEDE', 200:'#F4AEAE', 300:'#FF7676', 400:'#FF5C5C', 500:'#EB5454', 600:'#DC4E4E', 700:'#C54043', 800:'#9A3235', 900:'#772729', 950:'#5B1D1F', 1000:'#411516' },
        purple: { 50:'#F0ECFF', 100:'#D6CCFF', 200:'#C1B1FF', 300:'#A68FFF', 400:'#9276FF', 500:'#7856FF', 600:'#6E50E6', 700:'#5B44BB', 800:'#453688', 900:'#332A5D', 1000:'#1F1D2E' },

        // Semantic (reference these in components)
        bg: {
          'sub-surface':  'var(--bg-sub-surface)',
          'surface-alt':  'var(--bg-surface-alt)',
          'surface':      'var(--bg-surface)',
          'primary':      'var(--bg-primary)',
          'primary-alt':  'var(--bg-primary-alt)',
          'secondary':    'var(--bg-secondary)',
          'secondary-alt':'var(--bg-secondary-alt)',
          'tertiary':     'var(--bg-tertiary)',
        },
        fg: {
          primary:    'var(--text-primary)',
          secondary:  'var(--text-secondary)',
          tertiary:   'var(--text-tertiary)',
          quaternary: 'var(--text-quaternary)',
          onbg:       'var(--text-on-bg)',
        },
        brand: {
          DEFAULT:  'var(--brand-bg)',
          hover:    'var(--brand-bg-hover)',
          muted:    'var(--brand-bg-muted)',
          onmuted:  'var(--brand-bg-onmuted)',
          disabled: 'var(--brand-bg-disabled)',
          text:     'var(--brand-text)',
          border:   'var(--brand-border)',
        },
        positive: {
          DEFAULT: 'var(--positive-bg)',
          hover:   'var(--positive-bg-hover)',
          muted:   'var(--positive-bg-muted)',
          text:    'var(--positive-text)',
          border:  'var(--positive-border)',
        },
        negative: {
          DEFAULT: 'var(--negative-bg)',
          hover:   'var(--negative-bg-hover)',
          muted:   'var(--negative-bg-muted)',
          text:    'var(--negative-text)',
          border:  'var(--negative-border)',
        },
        warning: {
          DEFAULT: 'var(--warning-bg)',
          muted:   'var(--warning-bg-muted)',
          text:    'var(--warning-text)',
          border:  'var(--warning-border)',
        },
        divider: 'var(--divider-primary)',
      },
      spacing: {
        '4xs':'1px','3xs':'2px','3xsplus':'3px','2xs':'4px','2xsplus':'5px',
        'xs':'6px','xsplus':'7px','sm':'8px','smplus':'10px','md':'12px',
        'mdplus':'14px','lg':'16px','xl':'20px','2xl':'24px','3xl':'32px',
        '4xl':'40px','hg':'48px','2hg':'56px','3hg':'64px','4hg':'96px',
      },
      borderRadius: {
        xs:'1px', sm:'2px', md:'4px', lg:'6px', xl:'8px',
        '2xl':'12px', '3xl':'16px', '4xl':'20px', '5xl':'24px', pill:'999px',
      },
    },
  },
  plugins: [],
};
