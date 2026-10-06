tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        bone: { 50: '#FAF9F6', 100: '#F4F2EC', 200: '#E8E5DC', 300: '#D7D2C5' },
        obsidian: { 950: '#070709', 900: '#0C0D10', 800: '#111215', 700: '#16181D', 600: '#22252C' },
        sage: { 50: '#F2F6F3', 100: '#E3EDE6', 500: '#3D7055', 600: '#2D5542', 700: '#1E3C2E', glow: '#4EBA87' },
        terracotta: { 50: '#FAF4F0', 100: '#F4E7DF', 500: '#B85E2E', 600: '#944C23', glow: '#E07A48' },
        ochre: { 50: '#FAF6EF', 100: '#F4EBDA', 500: '#A67332', 600: '#855828', glow: '#D4973B' },
        joblex: {
          card: '#0c0d12',
          input: '#06070a',
          accent: '#8b5cf6',
          cyan: '#06b6d4',
          emerald: '#10b981'
        }
      }
    }
  }
};