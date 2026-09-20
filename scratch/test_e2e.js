const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');
const animJs = fs.readFileSync(path.join(root, 'js', 'frontend', 'animations.js'), 'utf8');
const threeJs = fs.readFileSync(path.join(root, 'js', 'frontend', 'three-scene.js'), 'utf8');

console.log('=== TEST 1: CSS Integrity & Liquid Glass Rules ===');
// Verify broken chaining is gone
assert.ok(!css.includes('html.dark .glass-card,\n/* 3D Perspective Tilt'), 'Severed selector should not exist');
assert.ok(!css.includes('html.dark .liquid-glass,\nhtml.dark .glass-card,'), 'Malformed dark glass selector should not exist');

// Verify dark mode liquid-glass rule exists
assert.ok(css.includes('html.dark .liquid-glass'), 'Dark liquid-glass rule must exist');
assert.ok(css.includes('rgba(16, 17, 21, 0.78)'), 'Dark card background must be dark obsidian');

// Verify no !important on card backgrounds/borders in base liquid-glass
const glassRuleMatch = /\.portal-card,\s*\.bento-card,\s*\.glass-card,\s*\.liquid-glass\s*\{([^}]+)\}/s.exec(css);
assert.ok(glassRuleMatch, 'Base glass rule must exist');
assert.ok(!glassRuleMatch[1].includes('!important'), 'Base glass rule must not use !important');

// Verify hover rules exist
const hoverRuleMatch = /\.portal-card:hover,\s*\.bento-card:hover,\s*\.glass-card:hover,\s*\.liquid-glass:hover\s*\{([^}]+)\}/s.exec(css);
assert.ok(hoverRuleMatch, 'Hover glass rule must exist');
console.log('✓ CSS integrity test passed');

console.log('\n=== TEST 2: Animations.js Mouseleave Symmetry ===');
const mouseleaveBlock = /addEventListener\('mouseleave',\s*function\(\)\s*\{([\s\S]*?)\}(?:,\s*\{[^}]+\})?\);/s.exec(animJs);
assert.ok(mouseleaveBlock, 'Mouseleave handler must exist');
assert.ok(!mouseleaveBlock[1].includes("classList.contains"), 'Mouseleave should symmetrically reset tilt angles for all listened cards without omitting liquid-glass');
assert.ok(mouseleaveBlock[1].includes("--tilt-x', '0deg'"), 'Tilt angles must reset to 0deg');
console.log('✓ Animations.js tilt symmetry test passed');

console.log('\n=== TEST 3: Synergy Step Buttons with Authentic Palette ===');
assert.ok(css.includes('.synergy-step-btn[data-step="1"].active'), 'Step 1 button active style must exist');
assert.ok(css.includes('.synergy-step-btn[data-step="2"].active'), 'Step 2 button active style must exist');
assert.ok(css.includes('.synergy-step-btn[data-step="3"].active'), 'Step 3 button active style must exist');
assert.ok(html.includes('data-step="1"'), 'Step 1 button in index.html must have data-step="1"');
assert.ok(html.includes('data-step="2"'), 'Step 2 button in index.html must have data-step="2"');
assert.ok(html.includes('data-step="3"'), 'Step 3 button in index.html must have data-step="3"');
console.log('✓ Synergy step buttons palette test passed');

console.log('\n=== TEST 4: Three.js Particles Scroll Continuity ===');
assert.ok(threeJs.includes('camY'), 'Three.js must track camY');
assert.ok(threeJs.includes('camY + halfY') && threeJs.includes('camY - halfY'), 'Particles must vertically wrap around camY to persist throughout page scroll');
assert.ok(threeJs.includes('darkPalette') && threeJs.includes('lightPalette'), 'Three.js must maintain dual-mode palettes');
console.log('✓ Three.js scene continuity test passed');

console.log('\n=== TEST 5: Dist Bundle Sync ===');
const distHtml = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const distCss = fs.readFileSync(path.join(root, 'dist', 'css', 'styles.css'), 'utf8');
assert.strictEqual(html, distHtml, 'dist/index.html must match index.html');
assert.strictEqual(css, distCss, 'dist/css/styles.css must match css/styles.css');
console.log('✓ Dist bundle sync test passed');

console.log('\nALL 5 END-TO-END VERIFICATION CHECKS PASSED!');
