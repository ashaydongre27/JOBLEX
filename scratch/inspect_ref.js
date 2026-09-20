const fs = require('fs');
const content = fs.readFileSync('C:/Users/Raman/.gemini/antigravity/brain/28417141-b90d-452d-a8ee-1cb06ff8202d/.system_generated/steps/10/content.md', 'utf8');

const pos = content.indexOf('scroll-line-anim');
console.log(content.slice(Math.max(0, pos - 300), pos + 300));
