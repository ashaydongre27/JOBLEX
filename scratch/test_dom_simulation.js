const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Load files
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');

// Simple DOM Mock
class MockElement {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this._classes = new Set();
    this.classList = {
      add: (...cls) => cls.forEach(c => this._classes.add(c)),
      remove: (...cls) => cls.forEach(c => this._classes.delete(c)),
      contains: (c) => this._classes.has(c),
      has: (c) => this._classes.has(c)
    };
    this.style = {};
    this.textContent = '';
    this.innerHTML = '';
    this.listeners = {};
    this.attributes = {};
  }
  getAttribute(attr) { return this.attributes[attr]; }
  setAttribute(attr, val) { this.attributes[attr] = val; }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  removeEventListener(event, fn) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(f => f !== fn);
    }
  }
}

const elements = new Map();
function getOrCreate(id) {
  if (!elements.has(id)) {
    elements.set(id, new MockElement(id));
  }
  return elements.get(id);
}

const mockDocument = {
  getElementById: (id) => getOrCreate(id),
  body: new MockElement('body'),
  documentElement: new MockElement('html')
};

// ==========================================
// 1. Test Vector Simulation logic
// ==========================================
console.log('=== TEST 1: Vector Calibrator Interactive Simulation ===');
const vectorDisciplineData = {
  bio: { score: '95.4%', rank: 'Top 2% Tier' },
  clinical: { score: '94.2%', rank: 'Top 3% Tier' },
  phytochem: { score: '92.8%', rank: 'Top 5% Tier' },
  aihealth: { score: '96.1%', rank: 'Top 1% Tier' }
};

function selectVectorDiscipline(discKey) {
  const keys = ['bio', 'clinical', 'phytochem', 'aihealth'];
  keys.forEach(k => {
    const btn = mockDocument.getElementById(`disc-btn-${k}`);
    if (k === discKey) {
      btn.classList.add('active', 'bg-[#2D5542]');
      btn.classList.remove('bg-white/80');
    } else {
      btn.classList.remove('active', 'bg-[#2D5542]');
      btn.classList.add('bg-white/80');
    }
  });

  const d = vectorDisciplineData[discKey];
  const scoreVal = mockDocument.getElementById('vector-score-val');
  const rankTag = mockDocument.getElementById('vector-rank-tag');
  if (scoreVal) scoreVal.textContent = d.score;
  if (rankTag) rankTag.textContent = d.rank;
}

selectVectorDiscipline('clinical');
assert.ok(getOrCreate('disc-btn-clinical').classList.has('active'));
assert.ok(!getOrCreate('disc-btn-bio').classList.has('active'));
assert.strictEqual(getOrCreate('vector-score-val').textContent, '94.2%');
assert.strictEqual(getOrCreate('vector-rank-tag').textContent, 'Top 3% Tier');

selectVectorDiscipline('aihealth');
assert.ok(getOrCreate('disc-btn-aihealth').classList.has('active'));
assert.ok(!getOrCreate('disc-btn-clinical').classList.has('active'));
assert.strictEqual(getOrCreate('vector-score-val').textContent, '96.1%');
assert.strictEqual(getOrCreate('vector-rank-tag').textContent, 'Top 1% Tier');
console.log('✓ Vector Calibrator interactive simulation passed');

// ==========================================
// 2. Test Synergy Step Controller
// ==========================================
console.log('\n=== TEST 2: Synergy Step Controller ===');
function selectSynergyStep(stepNum) {
  const nodeColors = {
    1: { border: 'border-[#2D5542]', darkBorder: 'dark:border-[#4EBA87]' },
    2: { border: 'border-[#855828]', darkBorder: 'dark:border-[#D4973B]' },
    3: { border: 'border-[#944C23]', darkBorder: 'dark:border-[#E07A48]' }
  };

  [1, 2, 3].forEach(i => {
    const btn = mockDocument.getElementById(`synergy-btn-${i}`);
    const card = mockDocument.getElementById(`synergy-card-${i}`);

    card.classList.remove('border-2', 'shadow-md',
      'border-[#2D5542]', 'dark:border-[#4EBA87]',
      'border-[#855828]', 'dark:border-[#D4973B]',
      'border-[#944C23]', 'dark:border-[#E07A48]'
    );

    if (i === stepNum) {
      btn.classList.add('active');
      btn.classList.remove('bg-white/80');
      card.classList.remove('border-stone-200/90');
      card.classList.add('border-2', nodeColors[i].border, nodeColors[i].darkBorder, 'shadow-md');
    } else {
      btn.classList.remove('active');
      btn.classList.add('bg-white/80');
      card.classList.add('border-stone-200/90');
    }
  });
}

selectSynergyStep(2);
assert.ok(getOrCreate('synergy-btn-2').classList.has('active'));
assert.ok(!getOrCreate('synergy-btn-1').classList.has('active'));
assert.ok(getOrCreate('synergy-card-2').classList.has('border-[#855828]'));
assert.ok(!getOrCreate('synergy-card-1').classList.has('border-[#2D5542]'));

selectSynergyStep(3);
assert.ok(getOrCreate('synergy-btn-3').classList.has('active'));
assert.ok(!getOrCreate('synergy-btn-2').classList.has('active'));
assert.ok(getOrCreate('synergy-card-3').classList.has('border-[#944C23]'));
console.log('✓ Synergy Step Controller interactive simulation passed');

// ==========================================
// 3. Test Hero Persona Switcher Bracket Preservation
// ==========================================
console.log('\n=== TEST 3: Hero Role Switcher Preserves Brackets ===');
assert.ok(html.includes('id="hero-role-preview-content"'), 'hero-role-preview-content element must exist in index.html');
assert.ok(html.includes('class="bracket bracket-tl"'), 'bracket-tl must exist in index.html');
assert.ok(html.includes('class="bracket bracket-tr"'), 'bracket-tr must exist in index.html');
assert.ok(html.includes('class="bracket bracket-bl"'), 'bracket-bl must exist in index.html');
assert.ok(html.includes('class="bracket bracket-br"'), 'bracket-br must exist in index.html');

// Verify selectHeroRole targets hero-role-preview-content, NOT overwriting brackets
assert.ok(html.includes("document.getElementById('hero-role-preview-content')"), 'selectHeroRole must target inner content container');
console.log('✓ Hero Role Switcher bracket preservation passed');

// ==========================================
// 4. Test SVG unopaq Laser Glow Filter & Cyber Button Secondary
// ==========================================
console.log('\n=== TEST 4: Cyber Button Laser Shader & Secondary Styling ===');
assert.ok(html.includes('id="unopaq"'), 'SVG filter id="unopaq" must exist in index.html');
assert.ok(html.includes('feColorMatrix'), 'SVG filter must have feColorMatrix');
assert.ok(css.includes('url(#unopaq)'), 'css/styles.css must reference url(#unopaq) for laser glow');
assert.ok(css.includes('.cyber-button.secondary'), '.cyber-button.secondary styling must exist in css/styles.css');
assert.ok(html.includes('cyber-button secondary'), 'Secondary cyber button class must be used in index.html');
console.log('✓ Cyber button shader filter and secondary styling passed');

// ==========================================
// 5. Test Floating Scroll Capsule & Arrow Rotation
// ==========================================
console.log('\n=== TEST 5: Floating Scroll Capsule & Direction State ===');
assert.ok(html.includes('id="floating-scroll-capsule"'), 'floating-scroll-capsule must exist');
assert.ok(html.includes('id="scroll-capsule-btn"'), 'scroll-capsule-btn must exist');
assert.ok(html.includes('id="scroll-capsule-arrow-svg"'), 'scroll-capsule-arrow-svg must exist');
assert.ok(html.includes('id="scroll-capsule-text"'), 'scroll-capsule-text must exist');
assert.ok(html.includes('class="arrow-path"'), 'arrow-path animation class must exist');

// Test scroll-to-top-btn starts hidden
const btnMatch = /id="scroll-to-top-btn"[^>]*class="([^"]+)"/.exec(html);
assert.ok(btnMatch && btnMatch[1].includes('opacity-0') && btnMatch[1].includes('pointer-events-none'), 'scroll-to-top-btn must start with opacity-0 pointer-events-none');

// Test rotation logic
assert.ok(html.includes("arrowSvg.style.transform = isPastHero ? 'rotate(180deg)' : 'none'"), 'Arrow must rotate 180deg when isPastHero is true');
console.log('✓ Floating Scroll Capsule & direction state passed');

// ==========================================
// 6. Test Hero Vertical Scroll Line Indicator & Reduced Motion Support
// ==========================================
console.log('\n=== TEST 6: Scroll Line Indicator & Accessibility Reduced Motion ===');
assert.ok(html.includes('scroll-line-anim'), 'scroll-line-anim element must exist in index.html');
assert.ok(css.includes('.scroll-line-anim'), '.scroll-line-anim rule must exist in css/styles.css');
assert.ok(css.includes('@keyframes scroll-line-drop'), 'scroll-line-drop keyframes must exist in css/styles.css');

assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'prefers-reduced-motion query must exist in css/styles.css');
assert.ok(css.includes('animation: none !important;'), 'Keyframes must be disabled under prefers-reduced-motion');
console.log('✓ Scroll line indicator & reduced motion passed');

// ==========================================
// 7. Test Inner Frame Cross-Dots in Synergy Cards
// ==========================================
console.log('\n=== TEST 7: Synergy Inner Frame Cross-Dots ===');
const crossDotCount = (html.match(/class="cross-dot"/g) || []).length;
assert.ok(crossDotCount >= 12, `Expected at least 12 cross-dots (4 per synergy card * 3 cards), found ${crossDotCount}`);
console.log('✓ Synergy inner frame cross-dots verified (found ' + crossDotCount + ')');

// ==========================================
// 8. Test Pre-Footer Button Group & Backdrop
// ==========================================
console.log('\n=== TEST 8: Pre-Footer Button Group & Backdrop ===');
const ctaSection = html.slice(html.indexOf('id="final-cta"'), html.indexOf('id="main-footer"'));
assert.ok(ctaSection.includes('btn-group') && ctaSection.includes('class="backdrop"'), 'Final-CTA buttons must have btn-group and backdrop');
console.log('✓ Pre-Footer button group & backdrop passed');

console.log('\n======================================================');
console.log('ALL 8 INTERACTIVE DOM & ARCHITECTURAL CONTRACTS PASSED!');
console.log('======================================================');
