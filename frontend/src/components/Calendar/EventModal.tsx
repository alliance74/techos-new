'use client';

import { useEffect, useState } from 'react';
import { X, Calendar, Clock, MapPin, Users, Bell } from 'lucide-react';
import { useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent } from '@/hooks/useCalendar';
import { CalendarEvent } from '@/types/calendar';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  defaultDate?: string;
}

export function EventModal({ isOpen, onClose, event, defaultDate }: EventModalProps) {
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    is_all_day: false,
    reminder_minutes: '15',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        start_time: new Date(event.start_time).toISOString().slice(0, 16),
        end_time: new Date(event.end_time).toISOString().slice(0, 16),
        location: event.location || '',
        is_all_day: event.is_all_day,
        reminder_minutes: event.reminder_minutes?.toString() || '15',
      });
    } else if (defaultDate) {
      const date = new Date(defaultDate);
      const endDate = new Date(date);
      endDate.setHours(date.getHours() + 1);
      
      setFormData({
        title: '',
        description: '',
        start_time: date.toISOString().slice(0, 16),
        end_time: endDate.toISOString().slice(0, 16),
        location: '',
        is_all_day: false,
        reminder_minutes: '15',
      });
    } else {
      const now = new Date();
      const later = new Date(now);
      later.setHours(now.getHours() + 1);
      
      setFormData({
        title: '',
        description: '',
        start_time: now.toISOString().slice(0, 16),
        end_time: later.toISOString().slice(0, 16),
        location: '',
        is_all_day: false,
        reminder_minutes: '15',
      });
    }
  }, [event, defaultDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      title: formData.title,
      description: formData.description || undefined,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
      location: formData.location || undefined,
      is_all_day: formData.is_all_day,
      reminder_minutes: parseInt(formData.reminder_minutes) || undefined,
    };

    try {
      if (event) {
        await updateEvent.mutateAsync({ id: event.id, data: payload });
      } else {
        await createEvent.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      // Error handled by mutation hooks
    }
  };

  const handleDelete = async () => {
    if (event && window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent.mutateAsync(event.id);
        onClose();
      } catch (error) {
        // Error handled by mutation hook
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-ink">
            {event ? 'Edit Event' : 'Create Event'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Event Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Team meeting"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-surface"
              placeholder="Event details"
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_all_day"
              checked={formData.is_all_day}
              onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
              className="h-4 w-4 border-border focus:ring-surface"
            />
            <label htmlFor="is_all_day" className="text-sm font-medium text-ink">
              All-day event
            </label>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start Time *
              </label>
              <Input
                type={formData.is_all_day ? 'date' : 'datetime-local'}
                value={formData.is_all_day ? formData.start_time.split('T')[0] : formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                End Time *
              </label>
              <Input
                type={formData.is_all_day ? 'date' : 'datetime-local'}
                value={formData.is_all_day ? formData.end_time.split('T')[0] : formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
                min={formData.start_time}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Office, Zoom link, etc."
            />
          </div>

          {/* Reminder */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Reminder
            </label>
            <select
              value={formData.reminder_minutes}
              onChange={(e) => setFormData({ ...formData, reminder_minutes: e.target.value })}
              className="w-full px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-surface"
            >
              <option value="">No reminder</option>
              <option value="0">At time of event</option>
              <option value="5">5 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="1440">1 day before</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div>
            {event && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Delete Event
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEvent.isPending || updateEvent.isPending}
            >
              {event ? 'Update' : 'Create'} Event
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
