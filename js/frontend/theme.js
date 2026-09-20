(function() {
  try {
    const saved = localStorage.getItem('joblex_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch(e) {}
})();

function toggleTheme(event) {
  const switchTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    try {
      localStorage.setItem('joblex_theme', isDark ? 'dark' : 'light');
    } catch(e) {}
    updateThemeIcon();
  };

  // Graceful fallback for browsers without View Transitions or users with reduced motion
  if (!document.startViewTransition || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    switchTheme();
    return;
  }

  // Determine origin coordinates for circular ripple animation (Skiper26 effect)
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  if (event && typeof event.clientX === 'number' && typeof event.clientY === 'number' && (event.clientX > 0 || event.clientY > 0)) {
    x = event.clientX;
    y = event.clientY;
  } else {
    const btn = document.getElementById('theme-toggle-btn') || document.querySelector('[onclick*="toggleTheme"]');
    if (btn) {
      const rect = btn.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const styleId = 'joblex-theme-transition-styles';
  let styleElement = document.getElementById(styleId);
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }

  styleElement.textContent = `
    ::view-transition-group(root) {
      animation-duration: 0.65s;
      animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }
    ::view-transition-new(root) {
      animation: reveal-theme-ripple 0.65s cubic-bezier(0.16, 1, 0.3, 1);
    }
    ::view-transition-old(root) {
      animation: none;
      z-index: -1;
    }
    @keyframes reveal-theme-ripple {
      from {
        clip-path: circle(0px at ${x}px ${y}px);
      }
      to {
        clip-path: circle(${endRadius}px at ${x}px ${y}px);
      }
    }
  `;

  document.startViewTransition(switchTheme);
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-toggle-icon');
  if (!icon) return;
  const isDark = document.documentElement.classList.contains('dark');
  if (icon.tagName.toLowerCase() === 'svg') {
    icon.innerHTML = isDark
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
  } else if (icon.classList.contains('material-symbols-outlined')) {
    icon.textContent = isDark ? 'light_mode' : 'dark_mode';
  } else {
    icon.innerHTML = isDark
      ? '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>'
      : '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcon();
});

if (typeof window !== 'undefined') {
  window.toggleTheme = toggleTheme;
  window.updateThemeIcon = updateThemeIcon;
}
