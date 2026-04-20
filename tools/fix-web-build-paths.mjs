import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

if (!existsSync(distDir)) {
  console.log('dist not found, skipping web path normalization.');
  process.exit(0);
}

const textExtensions = new Set(['.html', '.js', '.css', '.json']);
let updated = 0;

function normalize(content) {
  return content
    .replace(/(["'])\/_expo\//g, '$1./_expo/')
    .replace(/(["'])\/assets\//g, '$1./assets/')
    .replace(/(["'])\/favicon\.ico(["'])/g, '$1./favicon.ico$2')
    .replace(/url\(\/_expo\//g, 'url(./_expo/')
    .replace(/url\(\/assets\//g, 'url(./assets/');
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);

    if (stat.isDirectory()) {
      walk(full);
      continue;
    }

    const dot = name.lastIndexOf('.');
    const ext = dot >= 0 ? name.slice(dot) : '';
    if (!textExtensions.has(ext)) {
      continue;
    }

    const before = readFileSync(full, 'utf8');
    const after = normalize(before);

    if (after !== before) {
      writeFileSync(full, after, 'utf8');
      updated += 1;
      console.log(`normalized ${full}`);
    }
  }
}

walk(distDir);
console.log(`web path normalization complete: ${updated} file(s) updated.`);