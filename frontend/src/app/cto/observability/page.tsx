'use client';

import { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Info,
  RefreshCw,
  Search,
  Gauge,
  Wifi,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Select } from '@/components/UI/Select';
import { PageHeader } from '@/components/UI/PageHeader';
import { StatCard } from '@/components/UI/StatCard';


const SERVICES = ['api-gateway', 'auth-service', 'projects-svc', 'tasks-svc', 'notifications', 'db-proxy'];

type Severity = 'info' | 'warn' | 'error';

interface LogEntry {
  id: string;
  timestamp: string;
  severity: Severity;
  service: string;
  message: string;
  traceId?: string;
}

function generateLogs(): LogEntry[] {
  const now = Date.now();
  const messages: Record<Severity, string[]> = {
    info: [
      'Request processed successfully',
      'Cache hit ratio: 94.2%',
      'User session established',
      'Health check passed',
      'Database connection pool: 12/50',
      'Deployment completed — v2.4.1',
      'Background job finished in 142ms',
      'Rate limiter reset for client 10.0.1.5',
    ],
    warn: [
      'Response latency exceeded 800ms threshold',
      'Memory usage at 78% — approaching limit',
      'Retry attempt 2/3 for upstream call',
      'Connection pool at 80% capacity',
      'Deprecated endpoint hit: /api/v1/users/list',
      'SSL certificate expires in 14 days',
    ],
    error: [
      'Upstream timeout after 5000ms',
      'Failed to connect to replica DB',
      'Unhandled exception in task processor',
      'Circuit breaker OPEN for payments-svc',
      '5xx burst detected — 12 errors in 60s',
    ],
  };

  const logs: LogEntry[] = [];
  for (let i = 0; i < 60; i++) {
    const roll = Math.random();
    const severity: Severity = roll < 0.1 ? 'error' : roll < 0.25 ? 'warn' : 'info';
    const pool = messages[severity];
    logs.push({
      id: `log-${i}`,
      timestamp: new Date(now - i * 18_000 - Math.random() * 10_000).toISOString(),
      severity,
      service: SERVICES[Math.floor(Math.random() * SERVICES.length)],
      message: pool[Math.floor(Math.random() * pool.length)],
      traceId: `tr-${Math.random().toString(36).slice(2, 10)}`,
    });
  }
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const INITIAL_LOGS = generateLogs();

const SEVERITY_CONFIG: Record<Severity, { label: string; variant: 'error' | 'warning' | 'info'; icon: React.ElementType }> = {
  error: { label: 'Error', variant: 'error', icon: AlertTriangle },
  warn: { label: 'Warn', variant: 'warning', icon: AlertTriangle },
  info: { label: 'Info', variant: 'info', icon: Info },
};

export default function ObservabilityPage() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setLogs(generateLogs());
      setRefreshing(false);
    }, 600);
  };

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
      if (serviceFilter !== 'all' && log.service !== serviceFilter) return false;
      if (search && !log.message.toLowerCase().includes(search.toLowerCase()) && !log.service.includes(search.toLowerCase())) return false;
      return true;
    });
  }, [logs, severityFilter, serviceFilter, search]);

  const totalErrors = logs.filter((l) => l.severity === 'error').length;
  const totalWarns = logs.filter((l) => l.severity === 'warn').length;
  const errorRate = ((totalErrors / logs.length) * 100).toFixed(1);
  const uptime = 99.8;

  const breadcrumbs = [
    { label: 'CTO', href: '/cto' },
    { label: 'Observability' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Observability Portal"
        description="Live service logs, error rates, and system health metrics."
        breadcrumbs={breadcrumbs}
        actions={
          <Button size="sm" variant="secondary" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      {/* System health stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Uptime"
          value={`${uptime}%`}
          trend="up"
          change={0}
          icon={Wifi}
        />
        <StatCard
          title="Error Rate"
          value={`${errorRate}%`}
          trend={Number(errorRate) < 5 ? 'up' : 'down'}
          change={0}
          icon={AlertTriangle}
        />
        <StatCard
          title="Avg Latency"
          value="142ms"
          trend="up"
          change={0}
          icon={Gauge}
        />
        <StatCard
          title="Active Services"
          value={String(SERVICES.length)}
          trend="up"
          change={0}
          icon={Activity}
        />
      </div>

      {/* Service summary */}
      <Card>
        <h3 className="text-sm font-semibold text-ink mb-4">Service Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SERVICES.map((svc) => {
            const errCount = logs.filter((l) => l.service === svc && l.severity === 'error').length;
            const warnCount = logs.filter((l) => l.service === svc && l.severity === 'warn').length;
            const healthy = errCount === 0;
            return (
              <div
                key={svc}
                className={`flex flex-col gap-1 rounded-xl border p-3 transition-colors ${
                  !healthy ? 'border-danger/40 bg-danger/5' : warnCount > 0 ? 'border-warning/40 bg-warning/5' : 'border-border bg-bg-muted'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      !healthy ? 'bg-danger' : warnCount > 0 ? 'bg-warning' : 'bg-success'
                    }`}
                  />
                  <p className="text-xs font-medium text-ink truncate">{svc}</p>
                </div>
                {errCount > 0 && <p className="text-[10px] text-danger">{errCount} errors</p>}
                {errCount === 0 && warnCount > 0 && <p className="text-[10px] text-warning">{warnCount} warns</p>}
                {errCount === 0 && warnCount === 0 && <p className="text-[10px] text-success">Healthy</p>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Log stream */}
      <Card>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search logs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-bg-muted text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <Select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            label=""
          >
            <option value="all">All severities</option>
            <option value="error">Errors only</option>
            <option value="warn">Warnings only</option>
            <option value="info">Info only</option>
          </Select>
          <Select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            label=""
          >
            <option value="all">All services</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <p className="self-center text-xs text-ink-muted whitespace-nowrap">
            {filtered.length} of {logs.length} entries
          </p>
        </div>

        {/* Log entries */}
        <div className="space-y-1 font-mono text-xs max-h-[520px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-ink-muted">No log entries match your filters.</div>
          ) : (
            filtered.map((log) => {
              const cfg = SEVERITY_CONFIG[log.severity];
              const Icon = cfg.icon;
              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 px-3 py-2 rounded-lg border transition-colors ${
                    log.severity === 'error'
                      ? 'border-danger/20 bg-danger/5'
                      : log.severity === 'warn'
                      ? 'border-warning/20 bg-warning/5'
                      : 'border-transparent hover:bg-bg-muted'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                      log.severity === 'error'
                        ? 'text-danger'
                        : log.severity === 'warn'
                        ? 'text-warning'
                        : 'text-ink-muted'
                    }`}
                  />
                  <span className="text-ink-muted shrink-0 w-[160px]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <Badge
                    variant={cfg.variant}
                    size="sm"
                    className="shrink-0 w-14 justify-center"
                  >
                    {cfg.label}
                  </Badge>
                  <span className="text-brand shrink-0 w-32 truncate">{log.service}</span>
                  <span className="text-ink flex-1 min-w-0 truncate">{log.message}</span>
                  {log.traceId && (
                    <span className="text-ink-muted shrink-0 hidden lg:block">{log.traceId}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
