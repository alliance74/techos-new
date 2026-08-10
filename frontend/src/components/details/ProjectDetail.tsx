'use client';

import { useMemo, useState } from 'react';
import { FolderKanban, Milestone, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useEntityList, useUpdateEntity } from '@/hooks/useEntityApi';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { Progress } from '@/components/UI/Progress';
import { Tabs, TabList, Tab, TabPanel } from '@/components/UI/Tabs';
import {
  DetailHeader,
  DetailLoading,
  DetailNotFound,
  useDetailRecord,
  type DetailViewProps,
} from './DetailShell';
import { ActivityFeed, CommentThread, MetaGrid, PeopleList, RelatedList } from './shared';

const PHASES = ['Planning', 'Active', 'On Hold', 'Completed'];

type ApiTeam = {
  id: string;
  title?: string;
  name?: string;
  metadata?: { memberIds?: string[]; projectIds?: string[] };
};

export function ProjectDetail(props: DetailViewProps) {
  const { entityKey, detailId, title, breadcrumbs, basePath } = props;
  const { data, extras, isLoading } = useDetailRecord(entityKey, detailId);
  const teamsQuery = useEntityList('teams');
  const assignedTeams = useMemo(
    () =>
      ((teamsQuery.data || []) as ApiTeam[]).filter((team) => team.metadata?.projectIds?.includes(detailId)),
    [teamsQuery.data, detailId],
  );
  const statusMutation = useUpdateEntity('projects');
  const [status, setStatus] = useState<string | null>(null);

  if (isLoading) return <DetailLoading />;
  if (!data || !extras) return <DetailNotFound entityKey={entityKey} detailId={detailId} />;

  const current = status ?? data.status;
  const milestones = [
    { label: 'Kickoff', done: true, date: formatDate(data.createdAt) },
    { label: 'Design freeze', done: (data.progress || 0) >= 40, date: '—' },
    { label: 'Beta', done: (data.progress || 0) >= 70, date: '—' },
    { label: 'GA launch', done: (data.progress || 0) >= 100, date: data.dueDate ? formatDate(data.dueDate) : '—' },
  ];

  return (
    <div className="space-y-6">
      <DetailHeader
        title={data.title || title}
        subtitle={`Project · ${data.id}`}
        breadcrumbs={breadcrumbs}
        basePath={basePath}
        badges={
          <>
            <Badge variant={data.statusVariant}>{current}</Badge>
            {data.priority && <Badge variant="warning">{data.priority}</Badge>}
          </>
        }
        actions={
          <Button size="sm" onClick={() => toast.error('Project sharing is not available yet.')}>
            Share
          </Button>
        }
      />

      <Card className="!p-3">
        <div className="flex flex-wrap items-center gap-2">
          <FolderKanban className="h-4 w-4 text-brand" />
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted mr-2">Phase</span>
          {PHASES.map((phase) => (
            <button
              key={phase}
              type="button"
              onClick={() => {
                setStatus(phase);
                statusMutation.mutate({ id: data.id, data: { ...data, status: phase } });
              }}
              className={
                phase.toLowerCase() === current.toLowerCase()
                  ? 'px-2.5 py-1 rounded-lg text-xs font-medium bg-brand text-white'
                  : 'px-2.5 py-1 rounded-lg text-xs font-medium border border-border text-ink-secondary hover:border-brand/40'
              }
            >
              {phase}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Card className="space-y-4">
            <p className="text-sm text-ink-secondary leading-relaxed">{data.description}</p>
            {typeof data.progress === 'number' && (
              <div>
                <p className="text-sm text-ink-muted mb-2">Delivery progress</p>
                <Progress value={data.progress} label={`${data.progress}%`} />
              </div>
            )}
            <MetaGrid
              items={[
                { label: 'Project lead', value: data.owner },
                { label: 'Budget', value: typeof data.amount === 'number' ? formatCurrency(data.amount) : '—' },
                { label: 'Target date', value: data.dueDate ? formatDate(data.dueDate) : '—' },
                {
                  label: 'Visible to',
                  value:
                    String(data.visibility || '') ||
                    (Array.isArray(data.visible_to_roles) && data.visible_to_roles.length
                      ? (data.visible_to_roles as string[]).join(', ')
                      : 'All roles'),
                },
                { label: 'Last update', value: formatDate(data.updatedAt) },
              ]}
            />
            {data.tags && (
              <div className="flex flex-wrap gap-2">
                {data.tags.map((t) => (
                  <Badge key={t} size="sm">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          <Tabs defaultValue="milestones">
            <TabList aria-label="Project sections">
              <Tab value="milestones">Milestones</Tab>
              <Tab value="work">Work items</Tab>
              <Tab value="activity">Activity</Tab>
              <Tab value="discussion">Discussion</Tab>
            </TabList>
            <TabPanel value="milestones" className="pt-4">
              <Card className="space-y-3">
                <div className="flex items-center gap-2">
                  <Milestone className="h-4 w-4 text-brand" />
                  <h3 className="text-sm font-medium text-ink">Roadmap milestones</h3>
                </div>
                <ul className="space-y-3">
                  {milestones.map((m) => (
                    <li key={m.label} className="flex items-center justify-between text-sm">
                      <span className={m.done ? 'text-ink-muted line-through' : 'text-ink'}>{m.label}</span>
                      <span className="text-ink-muted">{m.date}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </TabPanel>
            <TabPanel value="work" className="pt-4">
              <Card>
                <RelatedList items={extras.related} entityKey={entityKey} recordId={detailId} />
              </Card>
            </TabPanel>
            <TabPanel value="activity" className="pt-4">
              <ActivityFeed items={extras.activities} />
            </TabPanel>
            <TabPanel value="discussion" className="pt-4">
              <CommentThread seed={extras.comments} entityKey={entityKey} recordId={detailId} />
            </TabPanel>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-4">
            <PeopleList title="Core team" names={extras.assignees} />
          </Card>
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-medium text-ink">Assigned squads</h3>
            </div>
            {assignedTeams.length === 0 ? (
              <p className="text-sm text-ink-muted">No team linked yet.</p>
            ) : (
              <ul className="space-y-2">
                {assignedTeams.map((team) => (
                  <li
                    key={team.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-ink">{team.title || team.name || 'Untitled team'}</span>
                    <Badge size="sm">{team.metadata?.memberIds?.length || 0}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
