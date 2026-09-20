const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST 1: Floating Telemetry Nodes Removal ===');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert.strictEqual(indexHtml.includes('node-float-1'), false, 'node-float-1 must be removed from index.html');
assert.strictEqual(indexHtml.includes('node-float-2'), false, 'node-float-2 must be removed from index.html');
assert.strictEqual(indexHtml.includes('node-float-3'), false, 'node-float-3 must be removed from index.html');
assert.strictEqual(indexHtml.includes('node-float-4'), false, 'node-float-4 must be removed from index.html');
assert.strictEqual(indexHtml.includes('extraction-ring'), false, 'extraction-ring must be removed from index.html');
console.log('✓ All 4 floating background shapes successfully removed');

console.log('=== TEST 2: Interactive Persona Section & Entrance Animation ===');
assert.ok(indexHtml.includes('id="hero-interactive-persona-section"'), 'hero-interactive-persona-section ID must exist in index.html');
assert.ok(indexHtml.includes('updatePersonaScrollEntrance'), 'updatePersonaScrollEntrance function must exist');

const stylesCss = fs.readFileSync(path.join(__dirname, '../css/styles.css'), 'utf8');
assert.ok(stylesCss.includes('#hero-interactive-persona-section'), 'styles.css must have styles for #hero-interactive-persona-section');
console.log('✓ Interactive persona entrance animation registered in DOM and CSS');

console.log('=== TEST 3: High-Tech Preloader Controller ===');
assert.ok(indexHtml.includes('id="joblex-preloader"'), 'joblex-preloader element must exist');
assert.ok(indexHtml.includes('id="preloader-progress-bar"'), 'preloader-progress-bar must exist');
assert.ok(indexHtml.includes('id="preloader-status-text"'), 'preloader-status-text must exist');
assert.ok(indexHtml.includes('initJoblexPreloader'), 'initJoblexPreloader controller must exist');
console.log('✓ High-tech preloader overlay and controller verified');

console.log('=== TEST 4: Skiper26 Component Registration ===');
const compPath = path.join(__dirname, '../components/ui/skiper26.tsx');
const srcCompPath = path.join(__dirname, '../src/components/ui/skiper26.tsx');
assert.ok(fs.existsSync(compPath), 'components/ui/skiper26.tsx must exist');
assert.ok(fs.existsSync(srcCompPath), 'src/components/ui/skiper26.tsx must exist');
const compContent = fs.readFileSync(compPath, 'utf8');
assert.ok(compContent.includes('export { Skiper26 }') || compContent.includes('export default Skiper26'), 'Skiper26 must be exported');
assert.ok(compContent.includes('useThemeToggle'), 'useThemeToggle must exist');
console.log('✓ Skiper26 component verified in components/ui/ and src/components/ui/');

console.log('=== TEST 5: Circular View Transition in theme.js ===');
const themeJs = fs.readFileSync(path.join(__dirname, '../js/frontend/theme.js'), 'utf8');
assert.ok(themeJs.includes('startViewTransition'), 'theme.js must use startViewTransition');
assert.ok(themeJs.includes('reveal-theme-ripple'), 'theme.js must define reveal-theme-ripple');
assert.ok(themeJs.includes('Math.hypot'), 'theme.js must calculate endRadius using Math.hypot');
console.log('✓ Circular View Transition theme toggle verified');

console.log('\n======================================================');
console.log('ALL 5 NEW FEATURE VERIFICATION CHECKS PASSED!');
console.log('======================================================\n');
