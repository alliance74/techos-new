'use client';

import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import Link from 'next/link';
import {
  Server,
  Database,
  Cloud,
  Shield,
  Layers,
  GitBranch,
  Box,
  Network,
  FileCode,
  CheckCircle,
  AlertTriangle,
  Info,
  Plus
} from 'lucide-react';

export default function ArchitecturePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">System Architecture</h1>
          <p className="text-ink-muted mt-2">Technical architecture and system design</p>
        </div>
        <Button onClick={() => {}}>
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Server className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Microservices</span>
          </div>
          <p className="text-3xl font-bold text-ink">12</p>
          <p className="text-xs text-success mt-1">All healthy</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-4 w-4 text-info" />
            <span className="text-sm text-ink-muted">Databases</span>
          </div>
          <p className="text-3xl font-bold text-ink">4</p>
          <p className="text-xs text-success mt-1">Optimal performance</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Cloud className="h-4 w-4 text-warning" />
            <span className="text-sm text-ink-muted">Cloud Services</span>
          </div>
          <p className="text-3xl font-bold text-ink">8</p>
          <p className="text-xs text-ink-muted mt-1">AWS & Azure</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Layers className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-ink">Architecture Components</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-bg-muted border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-brand" />
                  <p className="font-medium text-ink">Backend API</p>
                </div>
                <Badge variant="success">Healthy</Badge>
              </div>
              <p className="text-sm text-ink-muted">NestJS + TypeScript + PostgreSQL</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-ink-muted">
                <span>12 endpoints</span>
                <span>99.9% uptime</span>
              </div>
            </div>

            <div className="p-4 bg-bg-muted border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-info" />
                  <p className="font-medium text-ink">Frontend</p>
                </div>
                <Badge variant="success">Healthy</Badge>
              </div>
              <p className="text-sm text-ink-muted">Next.js 16 + React 19 + Tailwind</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-ink-muted">
                <span>SSR + CSR</span>
                <span>Optimized</span>
              </div>
            </div>

            <div className="p-4 bg-bg-muted border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-success" />
                  <p className="font-medium text-ink">Data Layer</p>
                </div>
                <Badge variant="success">Healthy</Badge>
              </div>
              <p className="text-sm text-ink-muted">PostgreSQL + Redis + TypeORM</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-ink-muted">
                <span>4 databases</span>
                <span>Cached</span>
              </div>
            </div>

            <div className="p-4 bg-bg-muted border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-warning" />
                  <p className="font-medium text-ink">WebSocket</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-sm text-ink-muted">Socket.IO for real-time features</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-ink-muted">
                <span>Real-time sync</span>
                <span>Auto-reconnect</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-success" />
            <h2 className="text-lg font-semibold text-ink">Security & Compliance</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-success-soft border border-success/20 rounded-lg">
              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-ink text-sm">JWT Authentication</p>
                <p className="text-xs text-ink-muted mt-1">Role-based access control implemented</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-success-soft border border-success/20 rounded-lg">
              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-ink text-sm">Data Encryption</p>
                <p className="text-xs text-ink-muted mt-1">TLS 1.3 + AES-256 encryption at rest</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-warning-soft border border-warning/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-ink text-sm">API Rate Limiting</p>
                <p className="text-xs text-ink-muted mt-1">Needs fine-tuning for production</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-bg-subtle border border-border rounded-lg">
              <Info className="h-4 w-4 text-info mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-ink text-sm">CORS Configuration</p>
                <p className="text-xs text-ink-muted mt-1">Configured for dev and prod environments</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-success-soft border border-success/20 rounded-lg">
              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-ink text-sm">Input Validation</p>
                <p className="text-xs text-ink-muted mt-1">DTOs with class-validator</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/cto/architecture/diagrams" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <FileCode className="h-8 w-8 text-brand mb-4" />
            <h3 className="font-semibold text-ink mb-2">Architecture Diagrams</h3>
            <p className="text-sm text-ink-muted">System design visualizations</p>
          </Card>
        </Link>
        <Link href="/cto/architecture/decisions" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <GitBranch className="h-8 w-8 text-success mb-4" />
            <h3 className="font-semibold text-ink mb-2">ADRs</h3>
            <p className="text-sm text-ink-muted">Architecture decision records</p>
          </Card>
        </Link>
        <Link href="/cto/architecture/patterns" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <Layers className="h-8 w-8 text-info mb-4" />
            <h3 className="font-semibold text-ink mb-2">Design Patterns</h3>
            <p className="text-sm text-ink-muted">Architectural patterns in use</p>
          </Card>
        </Link>
        <Link href="/cto/architecture/tech-stack" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <Box className="h-8 w-8 text-warning mb-4" />
            <h3 className="font-semibold text-ink mb-2">Tech Stack</h3>
            <p className="text-sm text-ink-muted">Technologies and frameworks</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
