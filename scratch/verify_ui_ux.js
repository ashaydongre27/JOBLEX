const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');

console.log('=== 1. CHECKING DOM IDS IN INDEX.HTML ===');
const idsReferenced = [
  'scroll-progress-bar',
  'scroll-to-top-btn',
  'three-canvas-container',
  'mobile-nav-drawer',
  'mobile-menu-toggle-btn',
  'mobile-menu-icon',
  'theme-toggle-btn',
  'theme-toggle-icon',
  'hero-tab-student',
  'hero-tab-academy',
  'hero-tab-company',
  'hero-role-preview-card',
  'disc-btn-bio',
  'disc-btn-clinical',
  'disc-btn-phytochem',
  'disc-btn-aihealth',
  'vec-dim-1-title',
  'vec-dim-1-val',
  'vec-dim-1-sub',
  'vec-dim-1-bar',
  'vec-dim-2-title',
  'vec-dim-2-val',
  'vec-dim-2-sub',
  'vec-dim-2-bar',
  'vec-dim-3-title',
  'vec-dim-3-val',
  'vec-dim-3-sub',
  'vec-dim-3-bar',
  'vector-score-val',
  'vector-rank-tag',
  'synergy-btn-1',
  'synergy-btn-2',
  'synergy-btn-3',
  'synergy-card-1',
  'synergy-card-2',
  'synergy-card-3'
];

let missingIds = [];
idsReferenced.forEach(id => {
  if (!html.includes('id="' + id + '"') && !html.includes("id='" + id + "'")) {
    missingIds.push(id);
  }
});
console.log('Missing DOM IDs:', missingIds);

console.log('\n=== 2. CHECKING SCRIPTS AND STYLESHEETS ===');
const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["']/gi;
let m;
while ((m = scriptRegex.exec(html)) !== null) {
  if (!m[1].startsWith('http')) {
    const exists = fs.existsSync(path.join(root, m[1]));
    console.log('Script:', m[1], 'Exists:', exists);
  }
}

const linkRegex = /<link\s+[^>]*href=["']([^"']+)["']/gi;
while ((m = linkRegex.exec(html)) !== null) {
  if (!m[1].startsWith('http') && m[1].includes('.css')) {
    const exists = fs.existsSync(path.join(root, m[1]));
    console.log('CSS:', m[1], 'Exists:', exists);
  }
}

console.log('\n=== 3. CHECKING CSS SELECTORS FOR DARK MODE GLASS ===');
const darkGlassRegex = /html\.dark\s+([^{]+)\{([^}]+)\}/g;
let foundDarkLiquid = false;
while ((m = darkGlassRegex.exec(css)) !== null) {
  if (m[1].includes('liquid-glass') || m[1].includes('glass-card')) {
    console.log('Found dark rule for:', m[1].trim());
    console.log('Content preview:', m[2].trim().slice(0, 100));
    foundDarkLiquid = true;
  }
}
if (!foundDarkLiquid) {
  console.log('WARNING: No dark mode rule found for .liquid-glass!');
}
