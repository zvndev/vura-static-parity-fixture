// Builds the static-parity fixture: copies site/ to dist/ and adds a CSP
// with the inline script's hash to vura.json, which Vura reads after the build.
import { createHash } from 'node:crypto';
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
cpSync('site', 'dist', { recursive: true });

const html = readFileSync('dist/index.html', 'utf8');
const inline = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (inline === undefined) throw new Error('site/index.html has no inline script');
const hash = createHash('sha256').update(inline).digest('base64');

const config = JSON.parse(readFileSync('vura.json', 'utf8'));
config.headers = (config.headers ?? []).filter((rule) => !('Content-Security-Policy' in rule.headers));
config.headers.push({
  source: '/(.*)',
  headers: {
    'Content-Security-Policy': `default-src 'self'; script-src 'self' 'sha256-${hash}'; frame-ancestors 'none'`,
  },
});
writeFileSync('vura.json', `${JSON.stringify(config, null, 2)}\n`);
console.log(`CSP script hash sha256-${hash}`);
