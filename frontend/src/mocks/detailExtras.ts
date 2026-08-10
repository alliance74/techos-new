import type { MockRecord } from './types';

export interface DetailComment {
  id: string;
  author: string;
  body: string;
  time: string;
}

export interface DetailActivity {
  id: string;
  actor: string;
  action: string;
  time: string;
}

export interface DetailAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface DetailRelated {
  id: string;
  title: string;
  kind: string;
  status: string;
  hrefHint?: string;
}

export interface DetailChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

/** Empty extras — activity comes from `/workspace/activity` via DetailShell. */
export function getDetailExtras(_entityKey: string, _record: MockRecord) {
  return {
    assignees: [] as string[],
    watchers: [] as string[],
    activities: [] as DetailActivity[],
    comments: [] as DetailComment[],
    attachments: [] as DetailAttachment[],
    checklist: [] as DetailChecklistItem[],
    related: [] as DetailRelated[],
    workflow: [] as string[],
  };
}

export function entitySingular(entityKey: string): string {
  if (entityKey.endsWith('ies')) return `${entityKey.slice(0, -3)}y`;
  if (entityKey.endsWith('s')) return entityKey.slice(0, -1);
  return entityKey;
}
