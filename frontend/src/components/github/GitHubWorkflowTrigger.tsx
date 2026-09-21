'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Progress } from '@/components/UI/Progress';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import {
  Zap,
  Play,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Workflow {
  id: number;
  name: string;
  path: string;
  state: string;
  html_url: string;
  badge_url: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
  event: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  run_number: number;
  actor: string;
  triggering_actor: string;
}

interface WorkflowRunDetail extends WorkflowRun {
  jobs: {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    started_at: string;
    completed_at: string;
    steps: {
      name: string;
      status: string;
      conclusion: string | null;
      number: number;
    }[];
  }[];
}

interface GitHubWorkflowTriggerProps {
  repositories?: string[]; // Pre-selected repo names
}

function StatusBadge({ status, conclusion }: { status: string; conclusion?: string | null }) {
  const colorMap: Record<string, string> = {
    success: 'bg-success/10 text-success border-success/20',
    failure: 'bg-danger/10 text-danger border-danger/20',
    cancelled: 'bg-ink-muted/10 text-ink-muted border-ink-muted/20',
    in_progress: 'bg-warning/10 text-warning border-warning/20',
    queued: 'bg-info/10 text-info border-info/20',
    pending: 'bg-info/10 text-info border-info/20',
    completed: 'bg-success/10 text-success border-success/20',
    neutral: 'bg-bg-muted text-ink-muted border-border',
  };

  const label = conclusion || status;
  const color = colorMap[conclusion || status] || 'bg-bg-muted text-ink-muted border-border';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${color}`}>
      {label}
    </span>
  );
}

function RunStatusIcon({ status, conclusion }: { status: string; conclusion?: string | null }) {
  if (status === 'in_progress') return <Clock className="h-4 w-4 text-warning animate-pulse" />;
  if (conclusion === 'success') return <CheckCircle className="h-4 w-4 text-success" />;
  if (conclusion === 'failure') return <XCircle className="h-4 w-4 text-danger" />;
  if (conclusion === 'cancelled') return <Square className="h-4 w-4 text-ink-muted" />;
  return <Clock className="h-4 w-4 text-ink-muted" />;
}

function formatSha(sha: string) {
  return sha ? sha.slice(0, 7) : '';
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString();
}

export function GitHubWorkflowTrigger({ repositories = [] }: GitHubWorkflowTriggerProps) {
  const [selectedRepo, setSelectedRepo] = useState(repositories[0] || '');
  const [repos, setRepos] = useState<string[]>(repositories);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<WorkflowRunDetail | null>(null);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [triggering, setTriggering] = useState<number | null>(null);
  const [triggerInputs, setTriggerInputs] = useState<Record<string, Record<string, string>>>({});

  // Fetch repos if not provided
  useEffect(() => {
    if (repos.length === 0) {
      fetchRepos();
    }
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      fetchWorkflows();
      fetchRuns();
    }
  }, [selectedRepo]);

  const fetchRepos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/github/repositories', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const result = await res.json();
      const repoNames = (result.data || []).map((r: any) => r.full_name);
      setRepos(repoNames);
      if (repoNames.length > 0 && !selectedRepo) setSelectedRepo(repoNames[0]);
    } catch {
      // Non-critical
    }
  };

  const fetchWorkflows = async () => {
    if (!selectedRepo) return;
    setLoadingWorkflows(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/github/workflows?repo=${encodeURIComponent(selectedRepo)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch workflows');
      const result = await res.json();
      setWorkflows(result.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingWorkflows(false);
    }
  };

  const fetchRuns = async () => {
    if (!selectedRepo) return;
    setLoadingRuns(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/github/workflows/runs?repo=${encodeURIComponent(selectedRepo)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch runs');
      const result = await res.json();
      setRuns(result.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingRuns(false);
    }
  };

  const triggerWorkflow = async (workflow: Workflow) => {
    setTriggering(workflow.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/github/workflows/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          repository_full_name: selectedRepo,
          workflow_id: workflow.path.split('/').pop() || workflow.name,
          ref: 'main',
          inputs: triggerInputs[workflow.id] || {},
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to trigger workflow');
      }
      toast.success(`Workflow "${workflow.name}" triggered!`);
      // Refresh runs after a short delay
      setTimeout(fetchRuns, 2000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTriggering(null);
    }
  };

  const getRunDetail = async (runId: number) => {
    if (selectedRun?.id === runId) {
      setSelectedRun(null);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/github/workflows/runs/${runId}?repo=${encodeURIComponent(selectedRepo)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (!res.ok) throw new Error('Failed to fetch run details');
      const result = await res.json();
      setSelectedRun(result.data);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const cancelRun = async (runId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/github/workflows/runs/${runId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ repo: selectedRepo }),
      });
      if (!res.ok) throw new Error('Failed to cancel run');
      toast.success('Workflow run cancelled');
      fetchRuns();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Repository selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-ink-muted mb-1 block">Repository</label>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full px-3 py-2 bg-bg-muted border border-border rounded-lg text-sm text-ink focus:outline-none focus:border-brand"
            >
              {repos.length === 0 && <option value="">No repositories</option>}
              {repos.map((repo) => (
                <option key={repo} value={repo}>{repo}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { fetchWorkflows(); fetchRuns(); }}
            className="mt-5 p-2 text-ink-muted hover:text-ink border border-border rounded-lg hover:bg-bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </Card>

      {/* Workflows */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-medium text-ink">Available Workflows</h3>
          </div>
        </div>
        {loadingWorkflows ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Zap className="h-8 w-8 text-ink-muted/40 mb-2" />
            <p className="text-sm text-ink-muted">No workflows found</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {workflows.map((wf) => (
              <div key={wf.id} className="px-4 py-3 hover:bg-bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className={`h-4 w-4 ${wf.state === 'active' ? 'text-success' : 'text-ink-muted'}`} />
                    <div>
                      <p className="text-sm font-medium text-ink">{wf.name}</p>
                      <p className="text-xs text-ink-muted">{wf.path}</p>
                    </div>
                    <StatusBadge status={wf.state} />
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={wf.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-ink-muted hover:text-brand transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={triggering === wf.id}
                      onClick={() => triggerWorkflow(wf)}
                      disabled={wf.state !== 'active'}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Trigger
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent runs */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-medium text-ink">Recent Runs</h3>
            </div>
            <button
              onClick={fetchRuns}
              className="text-xs text-brand hover:underline"
            >
              Refresh
            </button>
          </div>
        </div>
        {loadingRuns ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Clock className="h-8 w-8 text-ink-muted/40 mb-2" />
            <p className="text-sm text-ink-muted">No workflow runs yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {runs.map((run) => (
              <div key={run.id}>
                <button
                  onClick={() => getRunDetail(run.id)}
                  className="w-full px-4 py-3 text-left hover:bg-bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RunStatusIcon status={run.status} conclusion={run.conclusion} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink">{run.name}</span>
                          <span className="text-xs text-ink-muted">#{run.run_number}</span>
                          <StatusBadge status={run.status} conclusion={run.conclusion} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-ink-muted">{run.head_branch}</span>
                          <span className="text-xs text-ink-muted">·</span>
                          <span className="text-xs text-ink-muted font-mono">{formatSha(run.head_sha)}</span>
                          <span className="text-xs text-ink-muted">·</span>
                          <span className="text-xs text-ink-muted">{run.event}</span>
                          <span className="text-xs text-ink-muted">·</span>
                          <span className="text-xs text-ink-muted">{formatTime(run.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {run.status === 'in_progress' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); cancelRun(run.id); }}
                          className="text-xs text-danger hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                      <a
                        href={run.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-ink-muted hover:text-brand transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {selectedRun?.id === run.id ? (
                        <ChevronDown className="h-4 w-4 text-ink-muted" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-ink-muted" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded run details */}
                {selectedRun?.id === run.id && (
                  <div className="px-4 pb-4 border-t border-border/30">
                    <div className="mt-3 space-y-2">
                      {selectedRun.jobs.map((job) => (
                        <div key={job.id} className="flex items-center gap-3 px-3 py-2 bg-bg-muted rounded-lg">
                          <RunStatusIcon status={job.status} conclusion={job.conclusion} />
                          <div className="flex-1">
                            <p className="text-sm text-ink">{job.name}</p>
                            <p className="text-xs text-ink-muted">
                              {job.started_at ? formatTime(job.started_at) : 'Not started'}
                              {job.completed_at ? ` → ${formatTime(job.completed_at)}` : ''}
                            </p>
                          </div>
                          <StatusBadge status={job.status} conclusion={job.conclusion} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
