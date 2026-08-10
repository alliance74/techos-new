'use client';

import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { EmptyState } from '@/components/UI/EmptyState';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Briefcase,
  FileText,
  MapPin,
  Clock,
  Plus
} from 'lucide-react';
import { useState } from 'react';
import { useCreateEntity, useEntityList } from '@/hooks/useEntityApi';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';

export default function RecruitmentPage() {
  const { data: jobPostings = [], isLoading: jobsLoading } = useEntityList('jobs');
  const { data: candidates = [], isLoading: candidatesLoading } = useEntityList('candidates');
  const createJob = useCreateEntity('jobs');
  const [createOpen, setCreateOpen] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', role: '', location: '', employmentType: '' });
  const openJobs = jobPostings.filter((job) => job.status === 'open');
  const interviewingCandidates = candidates.filter((candidate) => candidate.status === 'interviewing' || candidate.status === 'interview_scheduled');
  const hiresThisMonth = candidates.filter((candidate) => candidate.status === 'hired' && candidate.updatedAt && new Date(candidate.updatedAt).getMonth() === new Date().getMonth()).length;

  if (jobsLoading || candidatesLoading) return <div className="flex min-h-[60vh] items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="success">Open</Badge>;
      case 'interviewing': return <Badge variant="warning">Interviewing</Badge>;
      case 'closed': return <Badge variant="default">Closed</Badge>;
      case 'under_review': return <Badge variant="warning">Under Review</Badge>;
      case 'interview_scheduled': return <Badge variant="info">Interview Scheduled</Badge>;
      case 'offer_sent': return <Badge variant="success">Offer Sent</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Recruitment</h1>
          <p className="text-ink-muted mt-2">Open positions, candidates and hiring pipeline</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="px-4 py-2 bg-brand text-ink-inverse text-sm font-medium rounded-xl hover:bg-brand-deep transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Job Posting
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <Briefcase className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">Open Positions</p>
          <p className="text-3xl font-bold text-ink mt-1">
            {openJobs.length}
          </p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <Users className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">Total Applicants</p>
          <p className="text-3xl font-bold text-ink mt-1">{candidates.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <Clock className="h-8 w-8 text-warning mb-3" />
          <p className="text-sm text-ink-muted">In Interviews</p>
          <p className="text-3xl font-bold text-ink mt-1">{interviewingCandidates.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <UserPlus className="h-8 w-8 text-success mb-3" />
          <p className="text-sm text-ink-muted">Hires This Month</p>
          <p className="text-3xl font-bold text-ink mt-1">{hiresThisMonth}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Open Positions
            </h2>
          </div>
          {jobPostings.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-12 w-12" />}
              title="No open positions"
              description="Create your first job posting to get started"
            />
          ) : (
            <div className="space-y-4">
              {jobPostings.map(job => (
                <Link
                  key={job.id}
                  href={`/ceo/hr/recruitment/${job.id}`}
                  className="block p-4 bg-bg-muted border border-border rounded-lg hover:border-border-strong transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-ink">{job.title}</h3>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="text-xs text-ink-muted flex items-center gap-1 capitalize">
                          <Briefcase className="h-3 w-3" /> {(job.metadata?.role || 'Unspecified').replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-ink-muted flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {job.metadata?.location || 'Unspecified'}
                        </span>
                        <span className="text-xs text-ink-muted">{job.metadata?.employmentType || 'Unspecified'}</span>
                        <span className="text-xs text-ink-muted">Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(job.status)}
                      <div className="flex items-center gap-1 text-sm text-ink-muted">
                        <Users className="h-3 w-3" /> {candidates.filter((candidate) => candidate.metadata?.jobId === job.id).length} applicants
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
              <FileText className="h-5 w-5" /> Recent Candidates
            </h2>
            <Link href="/ceo/hr/recruitment/candidates" className="text-sm text-ink-muted hover:text-ink">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {candidates.slice(0, 5).map(c => (
              <div key={c.id} className="p-3 bg-bg-muted border border-border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-full bg-brand-mist flex items-center justify-center text-brand text-xs font-semibold">
                    {(c.title || '').split(' ').filter(Boolean).map((name: string) => name[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink text-sm truncate">{c.title}</p>
                    <p className="text-xs text-ink-muted truncate">{c.metadata?.position || c.description || 'No position specified'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-ink-muted">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</p>
                  {getStatusBadge(c.status)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Job Posting">
        <form className="space-y-4" onSubmit={async (event) => {
          event.preventDefault();
          await createJob.mutateAsync({ ...jobForm, status: 'open' });
          setCreateOpen(false);
          setJobForm({ title: '', role: '', location: '', employmentType: '' });
        }}>
          <Input label="Job title" required value={jobForm.title} onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })} />
          <Input label="Role" value={jobForm.role} onChange={(event) => setJobForm({ ...jobForm, role: event.target.value })} />
          <Input label="Location" value={jobForm.location} onChange={(event) => setJobForm({ ...jobForm, location: event.target.value })} />
          <Input label="Employment type" value={jobForm.employmentType} onChange={(event) => setJobForm({ ...jobForm, employmentType: event.target.value })} />
          <div className="flex justify-end"><Button type="submit" loading={createJob.isPending}>Create posting</Button></div>
        </form>
      </Modal>
    </div>
  );
}
