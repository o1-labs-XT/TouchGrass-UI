const fs = require('fs');
const path = require('path');

const optimizedContent = fs.readFileSync(path.join(__dirname, 'optimized-svgs.txt'), 'utf8');

// Split by comment headers
const svgBlocks = optimizedContent.split(/\/\/ /).filter(Boolean);

const svgComponents = {};

svgBlocks.forEach((block) => {
  const lines = block.split('\n');
  const comment = lines[0].trim();
  const svgContent = lines.slice(1).join('\n').trim();
  
  // Determine component name from comment
  let componentName;
  if (comment.includes('wide button primary SVG default')) {
    componentName = 'WidePrimaryDefault';
  } else if (comment.includes('wide button primary svg hover')) {
    componentName = 'WidePrimaryHover';
  } else if (comment.includes('wide button secondary default')) {
    componentName = 'WideSecondaryDefault';
  } else if (comment.includes('wide button secondary hover')) {
    componentName = 'WideSecondaryHover';
  } else if (comment.includes('short primary default')) {
    componentName = 'ShortPrimaryDefault';
  } else if (comment.includes('short primary hover')) {
    componentName = 'ShortPrimaryHover';
  } else if (comment.includes('secondary default')) {
    componentName = 'ShortSecondaryDefault';
  } else if (comment.includes('secondary hover')) {
    componentName = 'ShortSecondaryHover';
  }
  
  if (componentName) {
    svgComponents[componentName] = { comment, svg: svgContent };
  }
});

// Generate React component file
let output = `// Auto-generated SVG components for GrassyButton
// Optimized with SVGO - 57.4% size reduction
// DO NOT EDIT - regenerate from Figma when needed

import React from 'react';

interface SVGProps {
  className?: string;
}

`;

Object.entries(svgComponents).forEach(([name, { comment, svg }]) => {
  output += `// ${comment}\nexport const ${name}: React.FC<SVGProps> = ({ className }) => (\n  ${svg.replace('<svg', '<svg className={className}')}\n);\n\n`;
});

fs.writeFileSync(path.join(__dirname, 'app/components/GrassyButtonSvgs.tsx'), output);

console.log('Created app/components/GrassyButtonSvgs.tsx');
console.log('Components:', Object.keys(svgComponents).join(', '));
