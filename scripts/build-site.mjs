import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist', 'site');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, 'site'), out, { recursive: true });
cpSync(join(root, 'pets', 'navi'), join(out, 'pet'), { recursive: true });
cpSync(join(root, 'audio'), join(out, 'audio'), { recursive: true });
cpSync(join(root, 'assets', 'previews'), join(out, 'previews'), { recursive: true });
console.log(`Built site: ${out}`);
