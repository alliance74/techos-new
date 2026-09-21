'use client';

import { useState } from 'react';
import {
  GitBranch,
  GitPullRequest,
  Shield,
  Code,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Users,
  Settings,
  Webhook,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  GitCommit,
  MessageSquare,
  Clock,
  FileCode,
  Merge,
} from 'lucide-react';

interface Capability {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  endpoint?: string;
  roles: ('ceo' | 'admin' | 'software_engineer')[];
  category: 'pr' | 'code' | 'ci' | 'webhooks' | 'management';
  details: string[];
}

const capabilities: Capability[] = [
  // PR Workflow
  {
    id: 'create-pr',
    name: 'Create Pull Requests',
    description: 'Create PRs from feature branches with task linking and auto-generated descriptions',
    icon: <GitPullRequest className="h-5 w-5" />,
    endpoint: 'POST /github/pull-requests',
    roles: ['ceo', 'admin', 'software_engineer'],
    category: 'pr',
    details: [
      'Link PRs to TechOS tasks automatically',
      'Auto-populate PR body with task context (status, priority)',
      'Set as draft or ready for review',
      'Choose merge strategy (merge, squash, rebase)',
    ],
  },
  {
    id: 'review-pr',
    name: 'Review Pull Requests',
    description: 'View PR diffs, check CI status, and track review progress',
    icon: <Eye className="h-5 w-5" />,
    endpoint: 'GET /github/pull-requests',
    roles: ['ceo', 'admin', 'software_engineer'],
    category: 'pr',
    details: [
      'List open/closed PRs across all repos',
      'View PR details including commits, additions, deletions',
      'Check commit statuses and CI/CD pipeline results',
      'Track review state (approved, changes requested, pending)',
    ],
  },
  {
    id: 'merge-pr',
    name: 'Merge Pull Requests',
    description: 'Merge approved PRs with configurable merge strategies',
    icon: <Merge className="h-5 w-5" />,
    endpoint: 'POST /github/pull-requests/:repo/:number/merge',
    roles: ['ceo', 'admin', 'software_engineer'],
    category: 'pr',
    details: [
      'Merge, squash, or rebase strategies',
      'Auto-update linked task status on merge',
      'Require approval checks before merge',
      'Track merge history and statistics',
    ],
  },

  // Code Quality
  {
    id: 'code-reviews',
    name: 'Code Reviews',
    description: 'AI-powered code review with automated suggestions and quality scoring',
    icon: <Code className="h-5 w-5" />,
    endpoint: 'POST /code-reviews/analyze',
    roles: ['ceo', 'admin', 'software_engineer'],
    category: 'code',
    details: [
      'AI-generated code review comments',
      'Quality score and improvement suggestions',
      'Security vulnerability detection',
      'Code style and best practices enforcement',
    ],
  },
  {
    id: 'commits',
    name: 'Commit Tracking',
    description: 'Track commits linked to tasks, sprints, and PRs',
    icon: <GitCommit className="h-5 w-5" />,
    roles: ['ceo', 'admin', 'software_engineer'],
    category: 'code',
    details: [
      'Link commits to TechOS tasks',
      'Track commit frequency per developer',
      'View commit history filtered by sprint or project',
      'Automatic task status updates on push',
    ],
  },

  // CI/CD
  {
    id: 'workflow-runs',
    name: 'Workflow Monitoring',
    description: 'Monitor GitHub Actions workflow runs and CI/CD pipeline status',
    icon: <Zap className="h-5 w-5" />,
    roles: ['ceo', 'admin', 'software_engineer'],
    category: 'ci',
    details: [
      'View workflow run status (success, failure, pending)',
      'Track CI/CD pipeline health over time',
      'Get notified of failed builds via TechOS notifications',
      'Correlate workflow failures with specific PRs',
    ],
  },
  {
    id: 'check-runs',
    name: 'Check Run Tracking',
    description: 'Track individual check runs (tests, linting, builds) per commit',
    icon: <CheckCircle className="h-5 w-5" />,
    roles: ['ceo', 'admin', 'software_engineer'],
    category: 'ci',
    details: [
      'Individual check status per commit',
      'Test coverage tracking',
      'Build time analytics',
      'Failure trend analysis',
    ],
  },

  // Webhooks & Integration
  {
    id: 'webhooks',
    name: 'Webhook Management',
    description: 'Receive and process GitHub webhook events in real-time',
    icon: <Webhook className="h-5 w-5" />,
    roles: ['ceo', 'admin'],
    category: 'webhooks',
    details: [
      'Real-time PR event processing',
      'Push event tracking and task auto-updates',
      'Issue event synchronization',
      'Review event processing',
    ],
  },
  {
    id: 'repo-sync',
    name: 'Repository Sync',
    description: 'Sync repository data from GitHub and manage installations',
    icon: <GitBranch className="h-5 w-5" />,
    endpoint: 'POST /github/repositories/sync',
    roles: ['ceo', 'admin'],
    category: 'management',
    details: [
      'Sync repository list from GitHub',
      'Manage GitHub App installations',
      'View installation details and permissions',
      'Track recent webhook events',
    ],
  },

  // Management
  {
    id: 'install-app',
    name: 'GitHub App Installation',
    description: 'Install and configure the TechOS GitHub App on repositories',
    icon: <Settings className="h-5 w-5" />,
    endpoint: 'GET /github/install-url',
    roles: ['ceo', 'admin'],
    category: 'management',
    details: [
      'Generate installation URL for organization',
      'Select repositories for integration',
      'Configure permission scopes',
      'Manage installation lifecycle (suspend, delete)',
    ],
  },
  {
    id: 'issues-sync',
    name: 'Issue Synchronization',
    description: 'Sync GitHub issues with TechOS tasks bidirectionally',
    icon: <MessageSquare className="h-5 w-5" />,
    roles: ['ceo', 'admin', 'software_engineer'],
    category: 'code',
    details: [
      'Auto-create TechOS tasks from GitHub issues',
      'Sync issue status with task status',
      'Map issue labels to TechOS priorities',
      'Track issue comments and discussions',
    ],
  },
];

const categoryLabels: Record<string, { label: string; color: string }> = {
  pr: { label: 'Pull Requests', color: 'text-success' },
  code: { label: 'Code Quality', color: 'text-brand' },
  ci: { label: 'CI/CD', color: 'text-warning' },
  webhooks: { label: 'Webhooks', color: 'text-info' },
  management: { label: 'Management', color: 'text-ink-muted' },
};

const roleLabels: Record<string, string> = {
  ceo: 'CEO',
  admin: 'Admin',
  software_engineer: 'Software Engineer',
};

const roleColors: Record<string, string> = {
  ceo: 'bg-warning/10 text-warning border-warning/20',
  admin: 'bg-info/10 text-info border-info/20',
  software_engineer: 'bg-success/10 text-success border-success/20',
};

export function GitHubActionsCapabilities({ role }: { role?: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const currentRole = role?.toLowerCase().replace(/\s+/g, '_') || 'ceo';

  const filteredCapabilities = capabilities.filter((cap) =>
    cap.roles.includes(currentRole as any)
  );

  const groupedByCategory = filteredCapabilities.reduce(
    (acc, cap) => {
      if (!acc[cap.category]) acc[cap.category] = [];
      acc[cap.category].push(cap);
      return acc;
    },
    {} as Record<string, Capability[]>
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Role selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-ink-muted">Viewing capabilities for:</span>
        <div className="flex items-center gap-2">
          {Object.entries(roleLabels).map(([key, label]) => (
            <span
              key={key}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                key === currentRole ? roleColors[key] : 'bg-bg-muted text-ink-muted border-border'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Capabilities by category */}
      {Object.entries(groupedByCategory).map(([category, caps]) => {
        const catInfo = categoryLabels[category] || { label: category, color: 'text-ink-muted' };
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${catInfo.color}`}>{catInfo.label}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {caps.map((cap) => (
                <div
                  key={cap.id}
                  className="bg-surface border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-brand/30"
                >
                  <button
                    onClick={() => toggleExpand(cap.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-bg-muted/50 transition-colors"
                  >
                    <div className="text-brand shrink-0">{cap.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink text-sm">{cap.name}</span>
                        {cap.roles.length < 3 && (
                          <span className="text-[10px] text-ink-muted">
                            ({cap.roles.map((r) => roleLabels[r]).join(', ')})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5 truncate">{cap.description}</p>
                    </div>
                    <div className="shrink-0 text-ink-muted">
                      {expandedId === cap.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </button>

                  {expandedId === cap.id && (
                    <div className="px-4 pb-4 border-t border-border/50">
                      {cap.endpoint && (
                        <div className="mt-3 px-3 py-2 bg-bg-muted rounded-lg text-xs font-mono text-ink-secondary">
                          {cap.endpoint}
                        </div>
                      )}
                      <ul className="mt-3 space-y-1.5">
                        {cap.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-ink-secondary">
                            <CheckCircle className="h-3 w-3 text-success shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
