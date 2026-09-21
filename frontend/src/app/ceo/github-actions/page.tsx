'use client';

import { GitHubActionsCapabilities } from '@/components/GitHubActionsCapabilities';
import { GitBranch, Webhook, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card } from '@/components/UI/Card';

export default function CeoGitHubActionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">GitHub Actions</h1>
          <p className="text-ink-muted mt-2">
            Full integration capabilities for managing repositories, PRs, CI/CD, and team workflows
          </p>
        </div>
        <a
          href="/api/github/install-url"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-ink hover:bg-bg-muted transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Install GitHub App
        </a>
      </div>

      {/* Status banner */}
      <Card className="p-4 bg-surface border border-border">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ink">GitHub App Configuration Required</p>
            <p className="text-xs text-ink-muted mt-1">
              To enable these capabilities, configure your GitHub App credentials in the environment variables:
              <code className="mx-1 px-1.5 py-0.5 bg-bg-muted rounded text-xs">GITHUB_APP_ID</code>,
              <code className="mx-1 px-1.5 py-0.5 bg-bg-muted rounded text-xs">GITHUB_PRIVATE_KEY</code>,
              <code className="mx-1 px-1.5 py-0.5 bg-bg-muted rounded text-xs">GITHUB_WEBHOOK_SECRET</code>.
              Once configured, install the GitHub App on your organization's repositories.
            </p>
          </div>
        </div>
      </Card>

      {/* Capabilities */}
      <GitHubActionsCapabilities role="ceo" />
    </div>
  );
}
