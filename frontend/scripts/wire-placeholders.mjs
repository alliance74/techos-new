import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(__dirname, '..', 'src', 'app');

const PLACEHOLDER_RE =
  /Content for .+ will be displayed here|Details for .+ will be displayed here|will be displayed here/;

const LIST_PAGE = `'use client';

import { ModuleWorkspace } from '@/components/pages/ModuleWorkspace';

export default function Page() {
  return <ModuleWorkspace />;
}
`;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name === 'page.tsx') files.push(full);
  }
  return files;
}

const pages = walk(appDir);
let updated = 0;
let skipped = 0;

for (const file of pages) {
  const content = fs.readFileSync(file, 'utf8');
  if (!PLACEHOLDER_RE.test(content)) {
    skipped++;
    continue;
  }
  // Skip login/register
  if (file.includes(`${path.sep}login${path.sep}`) || file.includes(`${path.sep}register${path.sep}`)) {
    skipped++;
    continue;
  }
  fs.writeFileSync(file, LIST_PAGE, 'utf8');
  updated++;
}

console.log(`Updated ${updated} placeholder pages. Skipped ${skipped} non-placeholder pages.`);
