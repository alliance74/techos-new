'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useCalendarEvents,
  useCreateCalendarEvent,
  useDeleteCalendarEvent,
} from '@/hooks/useCalendar';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { Modal } from '@/components/UI/Modal';
import { PageHeader } from '@/components/UI/PageHeader';
import { Input } from '@/components/UI/Input';
import { Select } from '@/components/UI/Select';
import { TextArea } from '@/components/UI/TextArea';
import { cn } from '@/lib/utils';

const TYPE_STYLES: Record<string, string> = {
  meeting: 'bg-brand text-ink-inverse',
  deadline: 'bg-warning text-ink-inverse',
  reminder: 'bg-info-soft text-info-text',
  interview: 'bg-success text-ink-inverse',
  review: 'bg-bg-inverse text-ink-inverse',
  event: 'bg-brand-soft text-ink-inverse',
  personal: 'bg-brand-soft text-ink-inverse',
};

interface CalendarBoardProps {
  breadcrumbs?: { label: string; href?: string }[];
}

type BoardEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  location?: string;
  description?: string;
  canEdit?: boolean;
  source?: string;
};

function toBoardEvent(row: any): BoardEvent {
  const start = row.start_datetime || row.start_time || row.start;
  const end = row.end_datetime || row.end_time || row.end;
  const startDate = start ? new Date(start) : new Date();
  const endDate = end ? new Date(end) : startDate;
  return {
    id: row.id,
    title: row.title || 'Event',
    date: format(startDate, 'yyyy-MM-dd'),
    startTime: format(startDate, 'HH:mm'),
    endTime: format(endDate, 'HH:mm'),
    type: row.type || 'event',
    location: row.location,
    description: row.description,
    canEdit: row.can_edit !== false && row.source !== 'meeting',
    source: row.source || 'personal',
  };
}

export function CalendarBoard({ breadcrumbs }: CalendarBoardProps) {
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeEvent, setActiveEvent] = useState<BoardEvent | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'event',
    start_time: '09:00',
    end_time: '10:00',
    description: '',
  });

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const { data: rawEvents = [], isLoading } = useCalendarEvents(
    monthStart.toISOString(),
    monthEnd.toISOString(),
  );
  const createEvent = useCreateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const events = useMemo(() => (rawEvents || []).map(toBoardEvent), [rawEvents]);

  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, BoardEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) || [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const dayEvents = (eventsByDate.get(selectedKey) || []).sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );

  const addEvent = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (form.end_time <= form.start_time) {
      toast.error('End time must be after start time');
      return;
    }
    const start = `${selectedKey}T${form.start_time}:00.000Z`;
    const end = `${selectedKey}T${form.end_time}:00.000Z`;
    await createEvent.mutateAsync({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      start_datetime: start,
      end_datetime: end,
      type: form.type,
      all_day: false,
    } as any);
    setForm({ title: '', type: 'event', start_time: '09:00', end_time: '10:00', description: '' });
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My calendar"
        description="Your personal schedule — add events, deadlines, and reminders. Invited meetings also appear here."
        breadcrumbs={breadcrumbs}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New event
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-ink">{format(cursor, 'MMMM yyyy')}</h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setCursor(subMonths(cursor, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCursor(addMonths(cursor, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-ink-muted py-8 text-center">Loading your calendar…</p>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-center text-xs text-ink-muted py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const dayList = eventsByDate.get(key) || [];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        'min-h-[84px] rounded-lg border p-1.5 text-left transition-colors',
                        isSameMonth(day, cursor)
                          ? 'bg-surface border-border'
                          : 'bg-bg-muted/40 border-transparent text-ink-muted',
                        isSameDay(day, selectedDate) && 'ring-2 ring-brand/40 border-brand/30',
                        isToday(day) && 'bg-brand-mist/40',
                      )}
                    >
                      <span className="text-xs font-medium">{format(day, 'd')}</span>
                      <div className="mt-1 space-y-0.5">
                        {dayList.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className={cn(
                              'truncate rounded px-1 text-[10px]',
                              TYPE_STYLES[ev.type] || TYPE_STYLES.event,
                            )}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayList.length > 2 && (
                          <p className="text-[10px] text-ink-muted">+{dayList.length - 2} more</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-ink mb-3">{format(selectedDate, 'EEEE, MMM d')}</h3>
          <div className="space-y-2">
            {dayEvents.length === 0 && (
              <p className="text-sm text-ink-muted">Nothing on your calendar for this day.</p>
            )}
            {dayEvents.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => setActiveEvent(ev)}
                className="w-full text-left rounded-lg border border-border p-3 hover:bg-bg-muted transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{ev.title}</p>
                  <Badge size="sm">{ev.source === 'meeting' ? 'invited' : ev.type}</Badge>
                </div>
                <p className="text-xs text-ink-muted mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {ev.startTime} – {ev.endTime}
                </p>
                {ev.location && (
                  <p className="text-xs text-ink-muted mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {ev.location}
                  </p>
                )}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New personal event" size="md">
        <div className="space-y-4">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Focus block, deadline, reminder…"
          />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="event">Event</option>
            <option value="reminder">Reminder</option>
            <option value="deadline">Deadline</option>
            <option value="meeting">Meeting (personal)</option>
            <option value="review">Review</option>
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Starts"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
            />
            <Input
              label="Ends"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
            />
          </div>
          <p className="text-xs text-ink-muted">Date: {selectedKey}</p>
          <TextArea
            label="Notes"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Optional details"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button loading={createEvent.isPending} onClick={() => void addEvent()}>
              Add to my calendar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!activeEvent} onClose={() => setActiveEvent(null)} title={activeEvent?.title || 'Event'}>
        {activeEvent && (
          <div className="space-y-4">
            <p className="text-sm text-ink-secondary">{activeEvent.description || 'No description'}</p>
            <p className="text-xs text-ink-muted">
              {activeEvent.date} · {activeEvent.startTime}–{activeEvent.endTime}
            </p>
            {activeEvent.source === 'meeting' ? (
              <p className="text-xs text-ink-muted">
                This is an invited meeting. Manage it from Meetings if you need details.
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              {activeEvent.canEdit ? (
                <Button
                  variant="danger"
                  loading={deleteEvent.isPending}
                  onClick={async () => {
                    try {
                      await deleteEvent.mutateAsync(activeEvent.id);
                      setActiveEvent(null);
                    } catch {
                      /* toast from hook */
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              ) : null}
              <Button onClick={() => setActiveEvent(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
