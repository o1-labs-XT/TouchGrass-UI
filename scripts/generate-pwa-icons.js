#!/usr/bin/env node

/**
 * Generates PWA icons in required sizes for mobile installation
 * This creates simple placeholder icons with "TG" text
 * Replace with actual logo generation when design assets are available
 */

const fs = require('fs');
const path = require('path');

// Create a simple SVG with TouchGrass initials
const createIcon = (size) => {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#5461c8"/>
  <text x="50%" y="55%" font-family="system-ui, -apple-system, sans-serif" font-size="${size * 0.35}" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">TG</text>
</svg>`;
  return svg;
};

const sizes = [192, 512];
const outputDir = path.join(__dirname, '../public/assets');

console.log('Creating temporary PWA icons...');

sizes.forEach(size => {
  const svg = createIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`Created: ${filename}`);
});

console.log('\n⚠️  These are placeholder icons. Replace with actual TouchGrass logo PNGs for production.');
console.log('To convert to PNG, use a tool like:');
console.log('  - ImageMagick: convert icon-192x192.svg icon-192x192.png');
console.log('  - Online converter: https://cloudconvert.com/svg-to-png');