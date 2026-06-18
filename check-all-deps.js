import fs from 'fs';
import path from 'path';

// Parse package.json
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const deps = Object.keys(pkg.dependencies || {});

// A quick and dirty script to find bare imports in a JS/TS file
function getBareImports(file) {
  const content = fs.readFileSync(file, 'utf-8');
  const imports = [];
  const regex = /import\s+.*?from\s+['"]([^'.][^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    let dep = match[1];
    if (dep.startsWith('@/')) continue; // local alias
    if (dep.startsWith('@wordpro/')) continue; // local alias
    // Get base package name
    if (dep.startsWith('@')) {
       dep = dep.split('/').slice(0,2).join('/');
    } else {
       dep = dep.split('/')[0];
    }
    imports.push(dep);
  }
  return imports;
}

const files = [
  './src/features/clerk-desk/components/letters/LetterComposer.tsx',
  './src/features/clerk-desk/components/wordpro/components/DocumentEditor.tsx',
  './src/features/clerk-desk/components/wordpro/components/Ribbon.tsx',
  './src/features/clerk-desk/components/wordpro/components/StatusBar.tsx',
];

for (const f of files) {
  const fileDeps = getBareImports(f);
  for (const d of fileDeps) {
    if (!deps.includes(d) && d !== 'react' && d !== 'react-dom') {
      console.log('Missing in package.json:', d, 'from', f);
    }
  }
}
