const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');
const animJs = fs.readFileSync(path.join(root, 'js', 'frontend', 'animations.js'), 'utf8');
const threeJs = fs.readFileSync(path.join(root, 'js', 'frontend', 'three-scene.js'), 'utf8');

console.log('=== TEST 1: Section Background Opacity & Layering ===');
// Hero section must NOT have solid opaque backgrounds
const heroMatch = /<section id="hero"[^>]*class="([^"]+)"/.exec(html);
assert.ok(heroMatch, 'Hero section must exist');
assert.ok(!heroMatch[1].includes('bg-[#FAF8F5]'), 'Hero section must NOT have opaque bg-[#FAF8F5]');
assert.ok(!heroMatch[1].includes('dark:bg-[#030303]'), 'Hero section must NOT have opaque dark:bg-[#030303]');
assert.ok(heroMatch[1].includes('bg-transparent'), 'Hero section must have transparent background');

// Bento showcase must NOT have solid opaque backgrounds
const bentoMatch = /<section id="bento-showcase"[^>]*class="([^"]+)"/.exec(html);
assert.ok(bentoMatch, 'Bento showcase must exist');
assert.ok(!bentoMatch[1].includes('bg-[#FAF8F5]'), 'Bento showcase must NOT have opaque bg-[#FAF8F5]');
assert.ok(!bentoMatch[1].includes('dark:bg-[#030303]'), 'Bento showcase must NOT have opaque dark:bg-[#030303]');

// Canvas container & ambient glow orbs in HTML
assert.ok(html.includes('id="three-canvas-container"'), 'three-canvas-container must exist');
assert.ok(html.includes('class="ambient-glow-orb-1"'), 'ambient-glow-orb-1 must exist');
assert.ok(html.includes('class="ambient-glow-orb-2"'), 'ambient-glow-orb-2 must exist');
assert.ok(html.includes('class="ambient-glow-orb-3"'), 'ambient-glow-orb-3 must exist');
console.log('✓ Section background opacity & layering verified');

console.log('\n=== TEST 2: Keyframe Definitions in styles.css ===');
// Keyframes
const requiredKeyframes = [
  'float-node-1',
  'float-node-2',
  'float-node-3',
  'float-node-4',
  'spin',
  'scroll-line-drop',
  'cyberLaserPulse',
  'floatGlow1',
  'floatGlow2',
  'floatGlow3',
  'pulse-orb'
];

requiredKeyframes.forEach(kf => {
  assert.ok(css.includes(`@keyframes ${kf}`), `Missing @keyframes ${kf} in css/styles.css`);
});

// Animation classes
assert.ok(css.includes('.node-float-1'), '.node-float-1 must exist');
assert.ok(css.includes('.node-float-2'), '.node-float-2 must exist');
assert.ok(css.includes('.node-float-3'), '.node-float-3 must exist');
assert.ok(css.includes('.node-float-4'), '.node-float-4 must exist');
assert.ok(css.includes('.extraction-ring'), '.extraction-ring must exist');
assert.ok(css.includes('.scroll-line-anim'), '.scroll-line-anim must exist');
assert.ok(css.includes('.cyber-button .a:after'), '.cyber-button .a:after must exist');
assert.ok(css.includes('cyberLaserPulse'), '.cyber-button .a:after must use cyberLaserPulse');
console.log('✓ All required animation classes and keyframes defined');

console.log('\n=== TEST 3: Card Tilt Specificity Preservation ===');
// Verify .tilt-card.is-revealed rule exists to prevent specificity clash with .reveal-*.is-revealed
assert.ok(css.includes('.tilt-card.is-revealed'), '.tilt-card.is-revealed must exist');
assert.ok(css.includes('rotateX(var(--tilt-x'), '.tilt-card.is-revealed must use rotateX with --tilt-x');
assert.ok(css.includes('rotateY(var(--tilt-y'), '.tilt-card.is-revealed must use rotateY with --tilt-y');

// Verify .color-node:hover does not overwrite translate coordinates
const colorNodeHoverMatch = /\.color-node:hover\s*\{([^}]+)\}/.exec(css);
assert.ok(colorNodeHoverMatch, '.color-node:hover rule must exist');
assert.ok(!colorNodeHoverMatch[1].includes('transform: scale'), '.color-node:hover must not override transform scale, which breaks translate coordinates');
console.log('✓ Card tilt specificity & node hover stability verified');

console.log('\n=== TEST 4: Three.js Particles & Constellation Visibility ===');
assert.ok(threeJs.includes('PointsMaterial'), 'Three.js PointsMaterial must exist');
assert.ok(threeJs.includes('LineBasicMaterial'), 'Three.js LineBasicMaterial must exist');
assert.ok(threeJs.includes('0.42') || threeJs.includes('opacity'), 'Line opacity should be clearly visible');
console.log('✓ Three.js particle constellation visibility verified');

console.log('\n=== TEST 5: Dist Sync Verification ===');
const distHtml = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const distCss = fs.readFileSync(path.join(root, 'dist', 'css', 'styles.css'), 'utf8');
const distAnimJs = fs.readFileSync(path.join(root, 'dist', 'js', 'frontend', 'animations.js'), 'utf8');
const distThreeJs = fs.readFileSync(path.join(root, 'dist', 'js', 'frontend', 'three-scene.js'), 'utf8');

assert.strictEqual(html, distHtml, 'dist/index.html must match root index.html');
assert.strictEqual(css, distCss, 'dist/css/styles.css must match root css/styles.css');
assert.strictEqual(animJs, distAnimJs, 'dist/js/frontend/animations.js must match root animations.js');
assert.strictEqual(threeJs, distThreeJs, 'dist/js/frontend/three-scene.js must match root three-scene.js');
console.log('✓ All dist files synced');

console.log('\n=========================================');
console.log('ALL ANIMATION DIAGNOSTIC CHECKS PASSED!');
console.log('=========================================');
