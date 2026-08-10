'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Hash,
  Lock,
  MessageSquare,
  Plus,
  Search,
  Send,
  Smile,
  Users,
  X,
  AtSign,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAddChannelMembers,
  useChannel,
  useChannelMessages,
  useChannels,
  useCreateChannel,
  useMarkChannelRead,
  useOpenDirectMessage,
  useSendMessage,
} from '@/hooks/useChannels';
import { useAddReaction, useMessageThread, useRemoveReaction } from '@/hooks/useMessages';
import { useRealtimeMessages, useTyping, useTypingIndicators } from '@/hooks/useRealtime';
import { useUsers } from '@/hooks/useUsers';
import { useSocket } from '@/contexts/SocketContext';
import { isRealtimeEnabled } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/UI/Avatar';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { TextArea } from '@/components/UI/TextArea';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import type { Channel, Message } from '@/types/channel';
import { cn } from '@/lib/utils';

const QUICK_REACTIONS = ['👍', '👀', '✅', '🎉', '🔥', '🙌'];

function userDisplayName(user: any) {
  return (
    user?.name ||
    `${user?.first_name || user?.firstName || ''} ${user?.last_name || user?.lastName || ''}`.trim() ||
    user?.email ||
    'User'
  );
}

function messageAuthor(m: Message, selfId?: string) {
  if (m.user_id === selfId || m.userId === selfId || m.sender_id === selfId) return 'You';
  return (
    m.user_name ||
    [m.user_first_name || m.user?.first_name || '', m.user_last_name || m.user?.last_name || '']
      .join(' ')
      .trim() ||
    'Teammate'
  );
}

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function channelLabel(channel: Channel, selfId?: string, users: any[] = []) {
  if (channel.type !== 'direct') return channel.name;
  const other = channel.members?.find((m) => m.user_id !== selfId);
  if (other) {
    return (
      `${other.first_name || ''} ${other.last_name || ''}`.trim() ||
      other.email ||
      channel.name
    );
  }
  // List payload may not include members — keep channel name
  const match = users.find((u) => channel.name.includes(userDisplayName(u).split(' ')[0]));
  return match ? userDisplayName(match) : channel.name;
}

interface MessagesWorkspaceProps {
  breadcrumbs?: { label: string; href?: string }[];
}

/**
 * Slack-style messaging for development teams:
 * dark workspace rail (Channels + DMs), dense message feed, reactions, threads.
 */
export function MessagesWorkspace(_props: MessagesWorkspaceProps) {
  const { data: channels = [], isLoading } = useChannels();
  const { data: users = [] } = useUsers();
  const user = useAuthStore((s) => s.user);
  const { isConnected } = useSocket();

  const [activeId, setActiveId] = useState('');
  const [draft, setDraft] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threadDraft, setThreadDraft] = useState('');
  const [sidebarFilter, setSidebarFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [dmOpen, setDmOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');
  const [inviteIds, setInviteIds] = useState<string[]>([]);
  const [dmQuery, setDmQuery] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const channelId = activeId || channels[0]?.id || '';
  const { data: channelDetail } = useChannel(channelId);
  const { data: messages = [] } = useChannelMessages(channelId);
  const { data: threadReplies = [] } = useMessageThread(threadId || '');
  const send = useSendMessage();
  const createChannel = useCreateChannel();
  const openDm = useOpenDirectMessage();
  const markRead = useMarkChannelRead();
  const addMembers = useAddChannelMembers();
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();

  const displayName =
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'User';

  useRealtimeMessages(channelId);
  const typingUsers = useTypingIndicators(channelId);
  const { handleTyping, handleStopTyping } = useTyping(channelId, displayName);

  const activeChannel = (channelDetail || channels.find((c) => c.id === channelId)) as
    | Channel
    | undefined;

  const teamChannels = useMemo(
    () =>
      channels.filter(
        (c) => c.type !== 'direct' && (!sidebarFilter || c.name.toLowerCase().includes(sidebarFilter.toLowerCase())),
      ),
    [channels, sidebarFilter],
  );
  const dmChannels = useMemo(
    () =>
      channels.filter(
        (c) =>
          c.type === 'direct' &&
          (!sidebarFilter ||
            channelLabel(c, user?.id, users as any[])
              .toLowerCase()
              .includes(sidebarFilter.toLowerCase())),
      ),
    [channels, sidebarFilter, user?.id, users],
  );

  const parentMessage = messages.find((m) => m.id === threadId);

  useEffect(() => {
    if (!activeId && channels[0]?.id) setActiveId(channels[0].id);
  }, [activeId, channels]);

  useEffect(() => {
    if (channelId) markRead.mutate(channelId);
    setThreadId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, channelId]);

  const onSend = async (content: string, parentMessageId?: string) => {
    if (!content.trim() || !channelId) return;
    handleStopTyping();
    await send.mutateAsync({
      channelId,
      content: content.trim(),
      parentMessageId,
    });
  };

  const toggleReaction = async (message: Message, emoji: string) => {
    const reactors = message.reactions?.[emoji] || [];
    const mine = user?.id && reactors.includes(user.id);
    if (mine) {
      await removeReaction.mutateAsync({ messageId: message.id, emoji });
    } else {
      await addReaction.mutateAsync({ messageId: message.id, emoji });
    }
  };

  const otherUsers = (users as any[]).filter((u) => u.id !== user?.id);

  return (
    <div className="slack-workspace -mx-4 -mb-6 flex h-[calc(100vh-8rem)] min-h-[420px] overflow-hidden rounded-t-2xl border border-border bg-white shadow-sm sm:-mx-6">
      {/* Workspace rail */}
      <aside className="flex w-[260px] shrink-0 flex-col overflow-hidden bg-[#19171d] text-[#d1d2d3]">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="truncate text-sm font-bold text-white">TechOS</p>
          <p className="truncate text-[11px] text-white/50">
            {isRealtimeEnabled() && isConnected ? '● Connected' : '○ Offline'}
          </p>
        </div>

        <div className="px-3 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-white/40" />
            <input
              value={sidebarFilter}
              onChange={(e) => setSidebarFilter(e.target.value)}
              placeholder="Find a channel"
              className="w-full rounded-md bg-white/10 py-1.5 pl-8 pr-2 text-xs text-white placeholder:text-white/40 outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          <SectionHeader
            title="Channels"
            onAdd={() => setCreateOpen(true)}
            addLabel="Create channel"
          />
          {isLoading ? (
            <p className="px-2 py-2 text-xs text-white/40">Loading…</p>
          ) : (
            teamChannels.map((c) => (
              <SidebarItem
                key={c.id}
                active={c.id === channelId}
                onClick={() => setActiveId(c.id)}
                icon={
                  c.type === 'private' ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <Hash className="h-3.5 w-3.5" />
                  )
                }
                label={c.name}
              />
            ))
          )}

          <SectionHeader
            title="Direct messages"
            onAdd={() => setDmOpen(true)}
            addLabel="New message"
          />
          {dmChannels.length === 0 ? (
            <p className="px-2 py-1 text-[11px] text-white/35">Message a teammate</p>
          ) : (
            dmChannels.map((c) => (
              <SidebarItem
                key={c.id}
                active={c.id === channelId}
                onClick={() => setActiveId(c.id)}
                icon={<MessageSquare className="h-3.5 w-3.5" />}
                label={channelLabel(c, user?.id, users as any[])}
              />
            ))
          )}
        </div>

        <div className="border-t border-white/10 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Avatar size="sm" name={displayName} />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">{displayName}</p>
              <p className="truncate text-[10px] text-white/45">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main conversation */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
        <header className="flex shrink-0 items-center gap-3 border-b border-[#e8e8e8] px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {activeChannel?.type === 'direct' ? (
                <MessageSquare className="h-4 w-4 text-[#1d1c1d]" />
              ) : activeChannel?.type === 'private' ? (
                <Lock className="h-4 w-4 text-[#1d1c1d]" />
              ) : (
                <Hash className="h-4 w-4 text-[#1d1c1d]" />
              )}
              <h1 className="truncate text-base font-bold text-[#1d1c1d]">
                {activeChannel
                  ? channelLabel(activeChannel, user?.id, users as any[])
                  : 'Select a channel'}
              </h1>
            </div>
            {activeChannel?.description ? (
              <p className="truncate text-xs text-[#616061]">{activeChannel.description}</p>
            ) : null}
          </div>
          {activeChannel && activeChannel.type !== 'direct' ? (
            <button
              type="button"
              onClick={() => {
                setInviteIds([]);
                setDmQuery('');
                setInviteOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#ddd] px-2.5 py-1.5 text-xs font-medium text-[#1d1c1d] hover:bg-[#f8f8f8]"
            >
              <Users className="h-3.5 w-3.5" />
              {activeChannel.members?.length || activeChannel.member_count || '—'}
            </button>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {!channelId ? (
            <div className="flex h-full items-center justify-center p-8 text-sm text-[#616061]">
              Create a channel or open a DM to get started.
            </div>
          ) : messages.length === 0 ? (
            <div className="mx-auto max-w-lg px-6 py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4f4f4]">
                <Hash className="h-6 w-6 text-[#1d1c1d]" />
              </div>
              <h2 className="text-lg font-bold text-[#1d1c1d]">
                {activeChannel?.type === 'direct'
                  ? channelLabel(activeChannel, user?.id, users as any[])
                  : `#${activeChannel?.name}`}
              </h2>
              <p className="mt-2 text-sm text-[#616061]">
                This is the start of the conversation. Share updates, PRs, blockers, and wins.
              </p>
            </div>
          ) : (
            <div className="py-3">
              {messages.map((m, i) => {
                const prev = messages[i - 1];
                const sameAuthor =
                  prev &&
                  (prev.user_id || prev.userId) === (m.user_id || m.userId) &&
                  new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000;
                return (
                  <MessageRow
                    key={m.id}
                    message={m}
                    compact={!!sameAuthor}
                    selfId={user?.id}
                    onReact={(emoji) => void toggleReaction(m, emoji)}
                    onOpenThread={() => setThreadId(m.id)}
                  />
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {typingUsers.length > 0 ? (
          <p className="shrink-0 px-5 pb-1 text-xs text-[#616061]">
            {typingUsers.map((u) => u.userName).join(', ')}{' '}
            {typingUsers.length === 1 ? 'is' : 'are'} typing…
          </p>
        ) : null}

        <Composer
          value={draft}
          onChange={(v) => {
            setDraft(v);
            handleTyping();
          }}
          onSend={async () => {
            const content = draft;
            setDraft('');
            await onSend(content);
          }}
          placeholder={
            activeChannel
              ? `Message ${
                  activeChannel.type === 'direct'
                    ? channelLabel(activeChannel, user?.id, users as any[])
                    : `#${activeChannel.name}`
                }`
              : 'Message…'
          }
          disabled={!channelId}
          loading={send.isPending}
        />
      </div>

      {/* Thread panel */}
      {threadId && parentMessage ? (
        <aside className="flex w-[360px] shrink-0 flex-col overflow-hidden border-l border-[#e8e8e8] bg-white">
          <div className="flex shrink-0 items-center justify-between border-b border-[#e8e8e8] px-4 py-2.5">
            <div>
              <p className="text-sm font-bold text-[#1d1c1d]">Thread</p>
              <p className="text-[11px] text-[#616061]">
                {activeChannel?.type === 'direct'
                  ? channelLabel(activeChannel, user?.id, users as any[])
                  : `#${activeChannel?.name}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setThreadId(null)}
              className="rounded p-1 text-[#616061] hover:bg-[#f8f8f8]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <MessageRow
              message={parentMessage}
              selfId={user?.id}
              onReact={(emoji) => void toggleReaction(parentMessage, emoji)}
            />
            <div className="mx-4 my-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#616061]">
              <span>{(threadReplies as Message[]).length} replies</span>
              <span className="h-px flex-1 bg-[#e8e8e8]" />
            </div>
            {(threadReplies as Message[]).map((r) => (
              <MessageRow
                key={r.id}
                message={r}
                selfId={user?.id}
                onReact={(emoji) => void toggleReaction(r, emoji)}
              />
            ))}
          </div>
          <Composer
            value={threadDraft}
            onChange={setThreadDraft}
            onSend={async () => {
              const content = threadDraft;
              setThreadDraft('');
              await onSend(content, threadId);
            }}
            placeholder="Reply…"
            disabled={!channelId}
            loading={send.isPending}
          />
        </aside>
      ) : null}

      {/* Create channel */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create a channel" size="md">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newChannelName.trim()) {
              toast.error('Channel name is required');
              return;
            }
            const result = await createChannel.mutateAsync({
              name: newChannelName.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-'),
              description: newChannelDesc.trim() || undefined,
              type: newChannelType,
              member_ids: inviteIds,
            } as any);
            const createdId = result?.data?.id || result?.id;
            if (createdId) setActiveId(createdId);
            setNewChannelName('');
            setNewChannelDesc('');
            setInviteIds([]);
            setNewChannelType('public');
            setCreateOpen(false);
          }}
        >
          <Input
            label="Name"
            required
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="e.g. releases"
          />
          <TextArea
            label="Description"
            value={newChannelDesc}
            onChange={(e) => setNewChannelDesc(e.target.value)}
            rows={2}
            placeholder="What’s this channel about?"
          />
          <div className="flex gap-2">
            {(['public', 'private'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNewChannelType(t)}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-left text-sm',
                  newChannelType === t
                    ? 'border-brand bg-brand/5 text-ink'
                    : 'border-border text-ink-muted hover:bg-bg-muted',
                )}
              >
                <span className="font-medium capitalize">{t}</span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  {t === 'public' ? 'Anyone in the org can join' : 'Invite-only'}
                </span>
              </button>
            ))}
          </div>
          <MemberPicker
            users={otherUsers}
            selected={inviteIds}
            onChange={setInviteIds}
            label="Add people (optional)"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createChannel.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* New DM */}
      <Modal isOpen={dmOpen} onClose={() => setDmOpen(false)} title="Direct message" size="md">
        <div className="space-y-3">
          <Input
            placeholder="Search people…"
            value={dmQuery}
            onChange={(e) => setDmQuery(e.target.value)}
          />
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {otherUsers
              .filter((u) => {
                const q = dmQuery.trim().toLowerCase();
                if (!q) return true;
                return userDisplayName(u).toLowerCase().includes(q) || String(u.email || '').toLowerCase().includes(q);
              })
              .map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-bg-muted"
                  onClick={async () => {
                    const ch = await openDm.mutateAsync(u.id);
                    const id = ch?.id || ch?.data?.id;
                    if (id) setActiveId(id);
                    setDmOpen(false);
                    setDmQuery('');
                  }}
                >
                  <Avatar size="sm" name={userDisplayName(u)} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{userDisplayName(u)}</p>
                    <p className="truncate text-xs text-ink-muted">{u.email}</p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </Modal>

      {/* Channel members — view existing + add new */}
      <Modal
        isOpen={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInviteIds([]);
          setDmQuery('');
        }}
        title={
          activeChannel
            ? `${activeChannel.type === 'private' ? '' : '#'}${activeChannel.name} · Members`
            : 'Members'
        }
        size="md"
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              In this channel ({(activeChannel?.members || []).length || activeChannel?.member_count || 0})
            </p>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {(activeChannel?.members || []).length === 0 ? (
                <p className="px-2 py-3 text-xs text-ink-muted">No members loaded yet.</p>
              ) : (
                (activeChannel?.members || []).map((m) => {
                  const name =
                    `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email || 'Member';
                  const isYou = m.user_id === user?.id;
                  return (
                    <div
                      key={m.id || m.user_id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5"
                    >
                      <Avatar size="sm" name={name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {name}
                          {isYou ? (
                            <span className="ml-1 font-normal text-ink-muted">(you)</span>
                          ) : null}
                        </p>
                        {m.email ? (
                          <p className="truncate text-xs text-ink-muted">{m.email}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 rounded bg-bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-ink-muted">
                        {m.role || 'member'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Add people
            </p>
            <Input
              placeholder="Search people to add…"
              value={dmQuery}
              onChange={(e) => setDmQuery(e.target.value)}
              className="mb-2"
            />
            <MemberPicker
              users={otherUsers
                .filter(
                  (u) => !(activeChannel?.members || []).some((m) => m.user_id === u.id),
                )
                .filter((u) => {
                  const q = dmQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    userDisplayName(u).toLowerCase().includes(q) ||
                    String(u.email || '')
                      .toLowerCase()
                      .includes(q)
                  );
                })}
              selected={inviteIds}
              onChange={setInviteIds}
              label=""
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button
              variant="ghost"
              onClick={() => {
                setInviteOpen(false);
                setInviteIds([]);
                setDmQuery('');
              }}
            >
              Close
            </Button>
            <Button
              loading={addMembers.isPending}
              disabled={!inviteIds.length || !channelId}
              onClick={async () => {
                await addMembers.mutateAsync({ channelId, memberIds: inviteIds });
                setInviteIds([]);
                setDmQuery('');
                setInviteOpen(false);
              }}
            >
              Add {inviteIds.length ? `(${inviteIds.length})` : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SectionHeader({
  title,
  onAdd,
  addLabel,
}: {
  title: string;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="mt-3 mb-1 flex items-center justify-between px-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-white/45">{title}</span>
      <button
        type="button"
        title={addLabel}
        onClick={onAdd}
        className="rounded p-0.5 text-white/45 hover:bg-white/10 hover:text-white"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SidebarItem({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[13px] transition-colors',
        active ? 'bg-[#1164a3] font-medium text-white' : 'text-[#d1d2d3] hover:bg-white/10',
      )}
    >
      <span className="opacity-80">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function MessageRow({
  message,
  compact,
  selfId,
  onReact,
  onOpenThread,
}: {
  message: Message;
  compact?: boolean;
  selfId?: string;
  onReact: (emoji: string) => void;
  onOpenThread?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const author = messageAuthor(message, selfId);
  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([, ids]) => ids?.length);

  return (
    <div
      className={cn('group relative px-5 hover:bg-[#f8f8f8]', compact ? 'py-0.5' : 'py-2')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex gap-3">
        {compact ? (
          <div className="w-9 shrink-0" />
        ) : (
          <Avatar size="sm" name={author} />
        )}
        <div className="min-w-0 flex-1">
          {!compact ? (
            <div className="mb-0.5 flex items-baseline gap-2">
              <span className="text-sm font-bold text-[#1d1c1d]">{author}</span>
              <span className="text-[11px] text-[#616061]">{formatTime(message.created_at)}</span>
            </div>
          ) : null}
          <p className="whitespace-pre-wrap break-words text-[15px] leading-snug text-[#1d1c1d]">
            {message.content || message.text}
          </p>
          {reactionEntries.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {reactionEntries.map(([emoji, ids]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(emoji)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs',
                    selfId && ids.includes(selfId)
                      ? 'border-[#1264a3]/40 bg-[#e8f5fa] text-[#1264a3]'
                      : 'border-[#ddd] bg-white text-[#1d1c1d] hover:bg-[#f8f8f8]',
                  )}
                >
                  <span>{emoji}</span>
                  <span>{ids.length}</span>
                </button>
              ))}
            </div>
          ) : null}
          {onOpenThread && (message.thread_count || 0) > 0 ? (
            <button
              type="button"
              onClick={onOpenThread}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#1264a3] hover:underline"
            >
              {message.thread_count} {message.thread_count === 1 ? 'reply' : 'replies'}
              <ChevronRight className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      </div>

      {hover ? (
        <div className="absolute -top-3 right-5 flex items-center gap-0.5 rounded-lg border border-[#ddd] bg-white p-0.5 shadow-sm">
          {QUICK_REACTIONS.slice(0, 4).map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="rounded px-1.5 py-0.5 text-sm hover:bg-[#f8f8f8]"
              onClick={() => onReact(emoji)}
            >
              {emoji}
            </button>
          ))}
          {onOpenThread ? (
            <button
              type="button"
              title="Reply in thread"
              className="rounded px-1.5 py-0.5 text-[#616061] hover:bg-[#f8f8f8]"
              onClick={onOpenThread}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void | Promise<void>;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <form
      className="shrink-0 border-t border-[#e8e8e8] p-3"
      onSubmit={(e) => {
        e.preventDefault();
        void onSend();
      }}
    >
      <div className="rounded-lg border border-[#ddd] bg-white focus-within:border-[#1264a3] focus-within:shadow-[0_0_0_1px_#1264a3]">
        <textarea
          value={value}
          disabled={disabled}
          rows={2}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void onSend();
            }
          }}
          className="w-full resize-none border-0 bg-transparent px-3 pt-2.5 text-[15px] text-[#1d1c1d] outline-none placeholder:text-[#616061]"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-1 text-[#616061]">
            <span className="rounded p-1" title="Emoji (use reactions on messages)">
              <Smile className="h-4 w-4" />
            </span>
            <span className="rounded p-1" title="Mentions coming soon">
              <AtSign className="h-4 w-4" />
            </span>
          </div>
          <button
            type="submit"
            disabled={disabled || !value.trim() || loading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#007a5a] text-white disabled:opacity-40 hover:bg-[#148567]"
            aria-label="Send"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <p className="mt-1.5 px-1 text-[10px] text-[#616061]">
        <kbd className="rounded border border-[#ddd] px-1">Enter</kbd> to send ·{' '}
        <kbd className="rounded border border-[#ddd] px-1">Shift</kbd>+
        <kbd className="rounded border border-[#ddd] px-1">Enter</kbd> for new line
      </p>
    </form>
  );
}

function MemberPicker({
  users,
  selected,
  onChange,
  label,
}: {
  users: any[];
  selected: string[];
  onChange: (ids: string[]) => void;
  label: string;
}) {
  return (
    <div>
      {label ? <p className="mb-1.5 text-xs font-medium text-ink">{label}</p> : null}
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
        {users.length === 0 ? (
          <p className="px-2 py-2 text-xs text-ink-muted">Everyone is already in this channel</p>
        ) : (
          users.map((u) => {
            const checked = selected.includes(u.id);
            return (
              <label
                key={u.id}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-bg-muted',
                  checked && 'bg-brand/5',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(
                      checked ? selected.filter((id) => id !== u.id) : [...selected, u.id],
                    )
                  }
                  className="h-4 w-4 rounded border-border"
                />
                <Avatar size="sm" name={userDisplayName(u)} />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{userDisplayName(u)}</span>
                  {u.email ? (
                    <span className="block truncate text-xs text-ink-muted">{u.email}</span>
                  ) : null}
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
