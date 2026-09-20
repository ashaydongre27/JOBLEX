const fs = require('fs');
const path = require('path');

function getFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') {
        results = results.concat(getFiles(full, exts));
      }
    } else if (exts.includes(path.extname(f))) {
      results.push(full);
    }
  }
  return results;
}

const htmlFiles = getFiles('.', ['.html']);
const jsFiles = getFiles('.', ['.js']);

// Collect all function names defined in JS files and script tags in HTML
const definedFunctions = new Set();

jsFiles.forEach(jf => {
  const content = fs.readFileSync(jf, 'utf8');
  const matches1 = content.matchAll(/function\s+([a-zA-Z0-9_$]+)\s*\(/g);
  for (const m of matches1) definedFunctions.add(m[1]);
  const matches2 = content.matchAll(/window\.([a-zA-Z0-9_$]+)\s*=/g);
  for (const m of matches2) definedFunctions.add(m[1]);
  const matches3 = content.matchAll(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/g);
  for (const m of matches3) definedFunctions.add(m[1]);
});

htmlFiles.forEach(hf => {
  const content = fs.readFileSync(hf, 'utf8');
  const scriptBlocks = content.matchAll(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi);
  for (const sb of scriptBlocks) {
    const sContent = sb[1];
    const matches1 = sContent.matchAll(/function\s+([a-zA-Z0-9_$]+)\s*\(/g);
    for (const m of matches1) definedFunctions.add(m[1]);
    const matches2 = sContent.matchAll(/window\.([a-zA-Z0-9_$]+)\s*=/g);
    for (const m of matches2) definedFunctions.add(m[1]);
  }
});

const builtins = new Set([
  'alert', 'confirm', 'prompt', 'open', 'close', 'print', 'focus', 'blur',
  'history', 'location', 'navigate', 'toggleMobileMenu', 'toggleSidebarCollapse',
  'toggleTheme', 'JoblexApiClient', 'JoblexNotifications', 'JoblexAPI'
]);

const missingByFile = {};

htmlFiles.forEach(hf => {
  const content = fs.readFileSync(hf, 'utf8');
  const calls = [
    ...content.matchAll(/onclick=["']([a-zA-Z0-9_$]+)\s*\(/g),
    ...content.matchAll(/onsubmit=["']([a-zA-Z0-9_$]+)\s*\(/g)
  ];
  const fileRel = path.relative('.', hf);

  for (const c of calls) {
    const fn = c[1];
    if (builtins.has(fn)) continue;
    if (fn.startsWith('Joblex')) continue;

    if (!definedFunctions.has(fn)) {
      if (!missingByFile[fileRel]) missingByFile[fileRel] = new Set();
      missingByFile[fileRel].add(fn);
    }
  }
});

console.log('=== AUDIT REPORT: MISSING OR UNDEFINED EVENT HANDLERS ===');
let hasMissing = false;
for (const [file, fns] of Object.entries(missingByFile)) {
  console.log(`\nFile: ${file}`);
  for (const fn of fns) {
    console.log(`  MISSING: ${fn}()`);
    hasMissing = true;
  }
}

if (!hasMissing) {
  console.log('All event handlers are defined across codebase!');
}
