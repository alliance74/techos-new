/**
 * Ensures every ModuleWorkspace list directory has a sibling [id]/page.tsx
 * so row clicks can open detail views without 404.
 */
import fs from 'node:fs';
import path from 'node:path';

const APP = path.resolve('src/app');
const PAGE = `'use client';

import { ModuleWorkspace } from '@/components/pages/ModuleWorkspace';

export default function Page() {
  return <ModuleWorkspace />;
}
`;

const SKIP_NAMES = new Set([
  'ai',
  'analytics',
  'calendar',
  'messages',
  'chat',
  'settings',
  'security',
  'organization',
  'login',
  'register',
  'teams',
  'team',
  'sprints',
  'tasks',
  'design-system',
  'typography',
  'colors',
  'components',
]);

const ROLE_ROOTS = new Set([
  'ceo',
  'cto',
  'finance',
  'software-engineer',
  'ui-ux-designer',
  'customer-support',
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === '[id]' || entry.name.startsWith('_')) continue;
    const full = path.join(dir, entry.name);
    out.push(full);
    walk(full, out);
  }
  return out;
}

let created = 0;
for (const dir of walk(APP)) {
  const pageFile = path.join(dir, 'page.tsx');
  if (!fs.existsSync(pageFile)) continue;

  const name = path.basename(dir);
  const rel = path.relative(APP, dir).replace(/\\/g, '/');
  const parts = rel.split('/');

  // Skip role dashboards and non-list hubs
  if (parts.length === 1 && ROLE_ROOTS.has(parts[0])) continue;
  if (SKIP_NAMES.has(name)) continue;
  if (parts.includes('settings') || parts.includes('analytics')) continue;

  const src = fs.readFileSync(pageFile, 'utf8');
  if (!src.includes('ModuleWorkspace')) continue;

  const idDir = path.join(dir, '[id]');
  const idPage = path.join(idDir, 'page.tsx');
  if (fs.existsSync(idPage)) continue;

  fs.mkdirSync(idDir, { recursive: true });
  fs.writeFileSync(idPage, PAGE, 'utf8');
  created += 1;
  console.log('created', path.relative(process.cwd(), idPage));
}

console.log(`Done. Created ${created} detail routes.`);
