// Run with: node generate-icons.js
// Creates simple placeholder icons - replace with real ones before launch
const fs = require('fs');

const svg192 = `<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" rx="40" fill="#111118"/>
  <text x="96" y="126" font-family="Arial" font-weight="800" font-size="96" fill="#0FA97A" text-anchor="middle">D</text>
</svg>`;

fs.writeFileSync('icon-192.svg', svg192);
console.log('Created icon-192.svg (rename to icon-192.png after converting)');
