'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { EmptyState } from '@/components/UI/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/UI/Table';
import { Pagination } from '@/components/UI/Pagination';
import { Input } from '@/components/UI/Input';
import { useProjects } from '@/hooks/useProjects';
import { useClientPagination } from '@/hooks/useClientPagination';
import {
  Code2,
  Search,
  Filter,
  ChevronRight,
  Plus,
  Calendar,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function CTOProjectsPage() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProjects = useMemo(
    () =>
      projects?.filter((project) => {
        const matchesSearch =
          project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
        return matchesSearch && matchesStatus;
      }) || [],
    [projects, searchTerm, statusFilter],
  );

  const { page, pageSize, total, pageItems, setPage, setPageSize, resetPage } =
    useClientPagination(filteredProjects, 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'planning':
        return <Badge variant="info">Planning</Badge>;
      case 'on_hold':
        return <Badge variant="warning">On Hold</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="error">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
  const planningProjects = projects?.filter(p => p.status === 'planning').length || 0;
  const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Projects</h1>
          <p className="text-ink-muted mt-2">Manage engineering projects and deliverables</p>
        </div>
        <Button onClick={() => router.push('/cto/projects/create')}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Total Projects</span>
          </div>
          <p className="text-3xl font-bold text-ink">{projects?.length || 0}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Active</span>
          </div>
          <p className="text-3xl font-bold text-ink">{activeProjects}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-4 w-4 text-info" />
            <span className="text-sm text-ink-muted">Planning</span>
          </div>
          <p className="text-3xl font-bold text-ink">{planningProjects}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Completed</span>
          </div>
          <p className="text-3xl font-bold text-ink">{completedProjects}</p>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                resetPage();
              }}
              className="pl-10 bg-bg-muted border-border text-ink"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-ink-muted" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                resetPage();
              }}
              className="bg-bg-muted border border-border rounded-lg px-3 py-2 text-sm text-ink-secondary focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={<Code2 className="h-12 w-12" />}
            title="No projects found"
            description="Create your first project to get started"
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer group/row"
                    onClick={() => router.push(`/cto/projects/${project.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/cto/projects/${project.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-ink group-hover/row:text-brand">
                          {project.name}
                        </p>
                        {project.description && (
                          <p className="text-sm text-ink-muted line-clamp-1 mt-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>
                      {project.start_date && project.end_date ? (
                        <div className="flex items-center gap-2 text-sm text-ink-secondary">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(project.start_date).toLocaleDateString()} -{' '}
                            {new Date(project.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-ink-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-ink-muted">—</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                        View
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
