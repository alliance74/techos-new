'use client';

import { GitHubActionsCapabilities } from '@/components/GitHubActionsCapabilities';
import { GitHubEventFeed } from '@/components/github/GitHubEventFeed';
import { GitHubWorkflowTrigger } from '@/components/github/GitHubWorkflowTrigger';
import { Code, GitPullRequest, Zap } from 'lucide-react';
import { Card } from '@/components/UI/Card';

export default function SoftwareEngineerGitHubActionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">GitHub Integration</h1>
          <p className="text-ink-muted mt-2">
            Your GitHub workflow — PRs, code reviews, commits, and CI/CD tracking
          </p>
        </div>
      </div>

      {/* Quick actions summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <GitPullRequest className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Pull Requests</p>
              <p className="text-xs text-ink-muted">Create, review, and merge PRs linked to tasks</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <Code className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Code Quality</p>
              <p className="text-xs text-ink-muted">AI reviews, commit tracking, and issue sync</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Zap className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">CI/CD</p>
              <p className="text-xs text-ink-muted">Workflow status, check runs, and build health</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Live event feed and workflow trigger */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GitHubEventFeed maxEvents={15} compact />
        <GitHubWorkflowTrigger />
      </div>

      {/* Capabilities */}
      <GitHubActionsCapabilities role="software_engineer" />
    </div>
  );
}
