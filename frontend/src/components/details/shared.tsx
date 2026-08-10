'use client';

import { useState, type ReactNode } from 'react';
import { Clock, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DetailActivity, DetailComment, DetailRelated } from '@/mocks/detailExtras';
import { useCreateComment, useDeleteComment, useEntityComments } from '@/hooks/useEntityApi';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/UI/Avatar';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { TextArea } from '@/components/UI/TextArea';
import { RelatedRecordsPanel } from './RelatedRecordsPanel';

export function ActivityFeed({ items }: { items: DetailActivity[] }) {
  return (
    <Card className="space-y-0 divide-y divide-border">
      {items.map((a) => (
        <div key={a.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          <Avatar name={a.actor} size="sm" />
          <div className="min-w-0">
            <p className="text-sm text-ink">
              <span className="font-medium">{a.actor}</span>{' '}
              <span className="text-ink-secondary">{a.action}</span>
            </p>
            <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {a.time}
            </p>
          </div>
        </div>
      ))}
    </Card>
  );
}

export function CommentThread({
  seed = [],
  entityKey,
  recordId,
}: {
  seed?: DetailComment[];
  entityKey?: string;
  recordId?: string;
}) {
  const [comment, setComment] = useState('');
  const live = Boolean(entityKey && recordId);
  const commentsQuery = useEntityComments(entityKey, recordId);
  const createComment = useCreateComment(entityKey || '', recordId || '');
  const deleteComment = useDeleteComment(entityKey || '', recordId || '');
  const currentUser = useAuthStore((s) => s.user);

  const remote = (commentsQuery.data || []).map((c) => ({
    id: c.id,
    author: c.author_name || 'User',
    authorId: c.author_id,
    body: c.body,
    time: c.created_at ? new Date(c.created_at).toLocaleString() : '',
  }));

  const comments = live
    ? remote
    : seed.map((c) => ({ ...c, authorId: undefined as string | undefined }));

  const post = async () => {
    if (!comment.trim()) {
      toast.error('Write a comment first');
      return;
    }
    if (!live) {
      toast.error('Comments are unavailable for this record');
      return;
    }
    await createComment.mutateAsync(comment.trim());
    setComment('');
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <TextArea
          label="Add a comment"
          placeholder="Share an update…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={post} loading={createComment.isPending} disabled={!live}>
            <Send className="h-4 w-4 mr-2" />
            Comment
          </Button>
        </div>
      </Card>

      {live && commentsQuery.isLoading ? (
        <p className="text-sm text-ink-muted">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-ink-muted">No comments yet. Be the first to leave one.</p>
      ) : (
        comments.map((c) => {
          const canDelete =
            live &&
            (c.authorId === currentUser?.id ||
              String(currentUser?.role || '').toLowerCase() === 'ceo');
          return (
            <Card key={c.id} className="!p-4">
              <div className="flex items-start gap-3">
                <Avatar name={c.author} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{c.author}</p>
                      <p className="text-xs text-ink-muted shrink-0">{c.time}</p>
                    </div>
                    {canDelete ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        loading={deleteComment.isPending}
                        onClick={() => deleteComment.mutate(c.id)}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-sm text-ink-secondary mt-1 leading-relaxed whitespace-pre-wrap">
                    {c.body}
                  </p>
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

export function RelatedList({
  items,
  entityKey,
  recordId,
}: {
  items: DetailRelated[];
  entityKey?: string;
  recordId?: string;
}) {
  if (entityKey && recordId) {
    return <RelatedRecordsPanel entityKey={entityKey} recordId={recordId} seed={items} />;
  }
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">No related records.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((r) => (
        <li
          key={`${r.kind}-${r.id}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
        >
          <div className="min-w-0">
            <p className="text-xs text-ink-muted">{r.kind}</p>
            <p className="text-sm font-medium text-ink truncate">{r.title}</p>
          </div>
          <Badge variant="default" size="sm">
            {r.status}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function MetaGrid({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-ink-muted">{item.label}</dt>
          <dd className="text-ink mt-1">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PeopleList({ title, names }: { title: string; names: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">{title}</p>
      <ul className="space-y-2">
        {names.map((name) => (
          <li key={name} className="flex items-center gap-2 text-sm text-ink">
            <Avatar name={name} size="sm" />
            <span className="truncate">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
