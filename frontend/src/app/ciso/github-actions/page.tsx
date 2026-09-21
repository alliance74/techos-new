'use client';

import { GitHubActionsCapabilities } from '@/components/GitHubActionsCapabilities';
import { GitHubEventFeed } from '@/components/github/GitHubEventFeed';
import { Shield, AlertTriangle, Lock, ExternalLink } from 'lucide-react';
import { Card } from '@/components/UI/Card';

export default function CisoGitHubActionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">GitHub Actions — Security</h1>
          <p className="text-ink-muted mt-2">
            Security scanning, vulnerability checks, and compliance workflow monitoring
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

      {/* Security banner */}
      <Card className="p-4 bg-surface border border-border">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ink">Security Workflows</p>
            <p className="text-xs text-ink-muted mt-1">
              Monitor security scanning workflows (SAST, DAST, dependency audits, secret detection)
              and ensure compliance checks pass before code is merged.
            </p>
          </div>
        </div>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Shield className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Security Scans</p>
              <p className="text-xs text-ink-muted">SAST, DAST, and dependency audits</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-danger/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Vulnerability Alerts</p>
              <p className="text-xs text-ink-muted">Real-time security event monitoring</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info/10 rounded-lg">
              <Lock className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Compliance</p>
              <p className="text-xs text-ink-muted">Policy enforcement and audit trails</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Live event feed */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GitHubEventFeed maxEvents={15} compact />
        <Card className="p-4">
          <h3 className="text-sm font-medium text-ink mb-3">Security Workflow Monitoring</h3>
          <p className="text-xs text-ink-muted mb-4">
            Security workflows are automatically triggered on pull requests and pushes to protected branches.
            Failed security checks will block merges.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-success" />
                <span className="text-sm text-ink">CodeQL Analysis</span>
              </div>
              <span className="text-xs text-success font-medium">Required</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-success" />
                <span className="text-sm text-ink">Dependency Review</span>
              </div>
              <span className="text-xs text-success font-medium">Required</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-warning" />
                <span className="text-sm text-ink">Secret Scanning</span>
              </div>
              <span className="text-xs text-warning font-medium">Advisory</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-warning" />
                <span className="text-sm text-ink">License Compliance</span>
              </div>
              <span className="text-xs text-warning font-medium">Advisory</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Capabilities */}
      <GitHubActionsCapabilities role="software_engineer" />
    </div>
  );
}
