'use client';

import { GitHubActionsCapabilities } from '@/components/GitHubActionsCapabilities';
import { GitHubEventFeed } from '@/components/github/GitHubEventFeed';
import { GitHubWorkflowTrigger } from '@/components/github/GitHubWorkflowTrigger';
import { Zap, GitBranch, Shield, ExternalLink } from 'lucide-react';
import { Card } from '@/components/UI/Card';

export default function CtoGitHubActionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">GitHub Actions</h1>
          <p className="text-ink-muted mt-2">
            CI/CD pipelines, infrastructure deployments, and engineering workflow management
          </p>
        </div>
        <a
          href="/api/github/install-url"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-ink hover:bg-bg-muted transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Configure GitHub App
        </a>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Zap className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Workflows</p>
              <p className="text-xs text-ink-muted">Trigger and monitor CI/CD pipelines</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <GitBranch className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Deployments</p>
              <p className="text-xs text-ink-muted">Track deployment status and history</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <Shield className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Code Quality</p>
              <p className="text-xs text-ink-muted">Automated checks and code reviews</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Live event feed and workflow trigger */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GitHubEventFeed maxEvents={20} />
        <GitHubWorkflowTrigger />
      </div>

      {/* Capabilities */}
      <GitHubActionsCapabilities role="software_engineer" />
    </div>
  );
}
