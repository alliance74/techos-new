'use client';

import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Progress } from '@/components/UI/Progress';
import Link from 'next/link';
import {
  Server,
  Activity,
  Zap,
  HardDrive,
  Cpu,
  Globe,
  Shield,
  Package,
  GitBranch,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus
} from 'lucide-react';

export default function InfrastructurePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Infrastructure</h1>
          <p className="text-ink-muted mt-2">DevOps, deployment, and system monitoring</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="success" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            All Systems Operational
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Server className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Uptime</span>
          </div>
          <p className="text-3xl font-bold text-ink">99.9%</p>
          <p className="text-xs text-success mt-1">Last 30 days</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-4 w-4 text-warning" />
            <span className="text-sm text-ink-muted">Response Time</span>
          </div>
          <p className="text-3xl font-bold text-ink">125ms</p>
          <p className="text-xs text-success mt-1">Average</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <GitBranch className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Deployments</span>
          </div>
          <p className="text-3xl font-bold text-ink">24</p>
          <p className="text-xs text-ink-muted mt-1">This month</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-4 w-4 text-info" />
            <span className="text-sm text-ink-muted">Containers</span>
          </div>
          <p className="text-3xl font-bold text-ink">18</p>
          <p className="text-xs text-success mt-1">Running</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-success" />
            <h2 className="text-lg font-semibold text-ink">System Health</h2>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-brand" />
                  <span className="text-sm text-ink-secondary">CPU Usage</span>
                </div>
                <span className="text-sm font-medium text-ink">45%</span>
              </div>
              <Progress value={45} />
              <p className="text-xs text-ink-muted mt-1">Optimal performance</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-info" />
                  <span className="text-sm text-ink-secondary">Memory Usage</span>
                </div>
                <span className="text-sm font-medium text-ink">62%</span>
              </div>
              <Progress value={62} />
              <p className="text-xs text-ink-muted mt-1">Within normal range</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-success" />
                  <span className="text-sm text-ink-secondary">Disk Usage</span>
                </div>
                <span className="text-sm font-medium text-ink">38%</span>
              </div>
              <Progress value={38} />
              <p className="text-xs text-ink-muted mt-1">Plenty of space available</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-warning" />
                  <span className="text-sm text-ink-secondary">Network I/O</span>
                </div>
                <span className="text-sm font-medium text-ink">78%</span>
              </div>
              <Progress value={78} />
              <p className="text-xs text-warning mt-1">Higher than usual</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Server className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-ink">Active Services</h2>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-bg-muted border border-border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-ink text-sm">API Server</p>
                <Badge variant="success">Running</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-ink-muted">
                <span>Port 4000</span>
                <span>8 instances</span>
                <span>Load: 45%</span>
              </div>
            </div>

            <div className="p-3 bg-bg-muted border border-border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-ink text-sm">PostgreSQL</p>
                <Badge variant="success">Running</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-ink-muted">
                <span>Port 5433</span>
                <span>Healthy</span>
                <span>Connections: 24</span>
              </div>
            </div>

            <div className="p-3 bg-bg-muted border border-border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-ink text-sm">Redis Cache</p>
                <Badge variant="success">Running</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-ink-muted">
                <span>Port 6379</span>
                <span>Hit rate: 94%</span>
                <span>Memory: 256MB</span>
              </div>
            </div>

            <div className="p-3 bg-bg-muted border border-border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-ink text-sm">WebSocket</p>
                <Badge variant="success">Running</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-ink-muted">
                <span>Socket.IO</span>
                <span>12 connections</span>
                <span>Realtime</span>
              </div>
            </div>

            <div className="p-3 bg-bg-muted border border-border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-ink text-sm">Mailhog (Dev)</p>
                <Badge variant="success">Running</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-ink-muted">
                <span>Port 1025</span>
                <span>SMTP</span>
                <span>UI: 8025</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center gap-2 mb-6">
          <GitBranch className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold text-ink">Recent Deployments</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-4 p-4 bg-bg-muted border border-border rounded-lg">
            <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-1">
                <p className="font-medium text-ink">Production Deploy</p>
                <Badge variant="success">Success</Badge>
              </div>
              <p className="text-sm text-ink-muted">Backend v2.4.1 - Bug fixes and performance improvements</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  2 hours ago
                </span>
                <span>Duration: 4m 32s</span>
                <span>main branch</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-bg-muted border border-border rounded-lg">
            <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-1">
                <p className="font-medium text-ink">Frontend Deploy</p>
                <Badge variant="success">Success</Badge>
              </div>
              <p className="text-sm text-ink-muted">UI updates and dark theme improvements</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  5 hours ago
                </span>
                <span>Duration: 3m 18s</span>
                <span>main branch</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-bg-muted border border-border rounded-lg">
            <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-1">
                <p className="font-medium text-ink">Database Migration</p>
                <Badge variant="success">Success</Badge>
              </div>
              <p className="text-sm text-ink-muted">Added new indexes for performance optimization</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  1 day ago
                </span>
                <span>Duration: 12m 45s</span>
                <span>migration-2024-08</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/cto/infrastructure/monitoring" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <Activity className="h-8 w-8 text-success mb-4" />
            <h3 className="font-semibold text-ink mb-2">Monitoring</h3>
            <p className="text-sm text-ink-muted">System metrics and alerts</p>
          </Card>
        </Link>
        <Link href="/cto/infrastructure/logs" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <Package className="h-8 w-8 text-info mb-4" />
            <h3 className="font-semibold text-ink mb-2">Logs</h3>
            <p className="text-sm text-ink-muted">Application and system logs</p>
          </Card>
        </Link>
        <Link href="/cto/infrastructure/ci-cd" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <GitBranch className="h-8 w-8 text-brand mb-4" />
            <h3 className="font-semibold text-ink mb-2">CI/CD</h3>
            <p className="text-sm text-ink-muted">Continuous integration pipelines</p>
          </Card>
        </Link>
        <Link href="/cto/infrastructure/security" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <Shield className="h-8 w-8 text-warning mb-4" />
            <h3 className="font-semibold text-ink mb-2">Security</h3>
            <p className="text-sm text-ink-muted">Security scanning and audits</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
