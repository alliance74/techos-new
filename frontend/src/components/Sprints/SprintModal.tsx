'use client';

import { useEffect, useState } from 'react';
import { X, Calendar, Target } from 'lucide-react';
import { useCreateSprint, useUpdateSprint, useDeleteSprint } from '@/hooks/useSprints';
import { Sprint } from '@/types/sprint';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';

interface SprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint?: Sprint;
  projectId?: string;
}

export function SprintModal({ isOpen, onClose, sprint, projectId }: SprintModalProps) {
  const createSprint = useCreateSprint();
  const updateSprint = useUpdateSprint();
  const deleteSprint = useDeleteSprint();

  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    start_date: '',
    end_date: '',
    status: 'planned' as Sprint['status'],
  });

  useEffect(() => {
    if (sprint) {
      setFormData({
        name: sprint.name,
        goal: sprint.goal || '',
        start_date: new Date(sprint.start_date).toISOString().split('T')[0],
        end_date: new Date(sprint.end_date).toISOString().split('T')[0],
        status: sprint.status,
      });
    } else {
      // Default to 2-week sprint starting today
      const today = new Date();
      const twoWeeksLater = new Date(today);
      twoWeeksLater.setDate(today.getDate() + 14);

      setFormData({
        name: '',
        goal: '',
        start_date: today.toISOString().split('T')[0],
        end_date: twoWeeksLater.toISOString().split('T')[0],
        status: 'planned',
      });
    }
  }, [sprint, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      name: formData.name,
      goal: formData.goal || undefined,
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: formData.status,
      project_id: projectId || sprint?.project_id,
    };

    try {
      if (sprint) {
        await updateSprint.mutateAsync({ id: sprint.id, data: payload });
      } else {
        await createSprint.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      // Error handled by mutation hooks
    }
  };

  const handleDelete = async () => {
    if (sprint && window.confirm('Are you sure you want to delete this sprint?')) {
      try {
        await deleteSprint.mutateAsync(sprint.id);
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
            {sprint ? 'Edit Sprint' : 'Create Sprint'}
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
          {/* Sprint Name */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Sprint Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Sprint 1"
            />
          </div>

          {/* Sprint Goal */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Sprint Goal
            </label>
            <textarea
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-surface"
              placeholder="What do you want to achieve in this sprint?"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date *
              </label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date *
              </label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                min={formData.start_date}
              />
            </div>
          </div>

          {/* Sprint Duration Info */}
          {formData.start_date && formData.end_date && (
            <div className="p-3 bg-gray-50 border border-gray-200 text-sm text-gray-600">
              Duration: {Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
            </div>
          )}

          {/* Status (only for editing) */}
          {sprint && (
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Sprint['status'] })}
                className="w-full px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-surface"
              >
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div>
            {sprint && sprint.status === 'planned' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Delete Sprint
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
              disabled={createSprint.isPending || updateSprint.isPending}
            >
              {sprint ? 'Update' : 'Create'} Sprint
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
