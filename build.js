const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

const rootHtmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
for (const file of rootHtmlFiles) {
  fs.copyFileSync(path.resolve(__dirname, file), path.resolve(distDir, file));
}

const dirs = ['css', 'js', 'src', 'assets'];
for (const dir of dirs) {
  const src = path.resolve(__dirname, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, path.resolve(distDir, dir), { recursive: true });
  }
}

console.log('✓ Build successful: All static HTML portals & assets bundled into dist/');
