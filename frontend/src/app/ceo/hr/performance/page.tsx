'use client';

import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { EmptyState } from '@/components/UI/EmptyState';
import Link from 'next/link';
import { useEntityList } from '@/hooks/useEntityApi';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import {
  TrendingUp,
  Star,
  Users,
  Target,
  Award,
  Clock,
  MoreHorizontal
} from 'lucide-react';

export default function PerformanceReviewsPage() {
  const { data: reviews = [], isLoading } = useEntityList('performanceReviews');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'in_progress': return <Badge variant="info">In Progress</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const scoredReviews = reviews.filter((review) => Number(review.metadata?.score) > 0);
  const avgScore = scoredReviews.length
    ? scoredReviews.reduce((sum, review) => sum + Number(review.metadata?.score), 0) / scoredReviews.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Performance Reviews</h1>
          <p className="text-ink-muted mt-2">Employee performance tracking and reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <Users className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">Total Reviews</p>
          <p className="text-3xl font-bold text-ink mt-1">{reviews.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <Award className="h-8 w-8 text-success mb-3" />
          <p className="text-sm text-ink-muted">Completed</p>
          <p className="text-3xl font-bold text-ink mt-1">{reviews.filter(r => r.status === 'completed').length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <Clock className="h-8 w-8 text-warning mb-3" />
          <p className="text-sm text-ink-muted">Pending</p>
          <p className="text-3xl font-bold text-ink mt-1">{reviews.filter(r => r.status === 'pending').length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <Star className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">Avg Score</p>
          <p className="text-3xl font-bold text-ink mt-1">{avgScore.toFixed(1)}</p>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <h2 className="text-lg font-semibold text-ink mb-6 flex items-center gap-2">
          <Target className="h-5 w-5" /> Recent Reviews
        </h2>
        {reviews.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-12 w-12" />}
            title="No reviews yet"
            description="Schedule performance reviews for your team"
          />
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <Link
                key={review.id}
                href={`/ceo/hr/performance/${review.id}`}
                className="flex items-center justify-between p-4 bg-bg-muted border border-border rounded-lg hover:border-border-strong transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-brand-mist flex items-center justify-center text-brand font-semibold text-sm">
                    {(review.metadata?.employeeName || review.owner || '—').split(' ').map((name: string) => name[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-ink">{review.metadata?.employeeName || review.owner || 'Unassigned'}</p>
                    <p className="text-sm text-ink-muted">{review.metadata?.position || 'No position'} · {review.metadata?.period || 'No review period'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {Number(review.metadata?.score) > 0 ? (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-warning fill-yellow-400" />
                      <span className="text-ink font-semibold">{Number(review.metadata?.score).toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-ink-muted text-sm">No score</span>
                  )}
                  {getStatusBadge(review.status)}
                  <p className="text-xs text-ink-muted">{review.dueDate ? new Date(review.dueDate).toLocaleDateString() : '—'}</p>
                  <MoreHorizontal className="h-4 w-4 text-ink-muted" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
