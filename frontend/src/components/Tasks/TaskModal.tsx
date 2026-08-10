'use client';

import { useEffect, useState } from 'react';
import { X, Calendar, User, Tag, Clock, TrendingUp } from 'lucide-react';
import { useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { Task } from '@/types/task';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  defaultStatus?: Task['status'];
  projectId?: string;
}

export function TaskModal({ isOpen, onClose, task, defaultStatus = 'todo', projectId }: TaskModalProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'medium' as Task['priority'],
    estimated_hours: '',
    story_points: '',
    due_date: '',
    tags: '',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        estimated_hours: task.estimated_hours?.toString() || '',
        story_points: task.story_points?.toString() || '',
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
        tags: task.tags?.join(', ') || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'medium',
        estimated_hours: '',
        story_points: '',
        due_date: '',
        tags: '',
      });
    }
  }, [task, defaultStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      project_id: projectId || task?.project_id,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
      story_points: formData.story_points ? parseInt(formData.story_points) : undefined,
      due_date: formData.due_date || undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : undefined,
    };

    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, data: payload });
      } else {
        await createTask.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      // Error handled by mutation hooks
    }
  };

  const handleDelete = async () => {
    if (task && window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask.mutateAsync(task.id);
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
            {task ? 'Edit Task' : 'Create Task'}
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
              Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Task title"
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
              rows={4}
              className="w-full px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-surface"
              placeholder="Task description"
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                className="w-full px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-surface"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                className="w-full px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-surface"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Estimation Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Estimated Hours
              </label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Story Points
              </label>
              <Input
                type="number"
                min="0"
                value={formData.story_points}
                onChange={(e) => setFormData({ ...formData, story_points: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date
            </label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="frontend, bug, urgent (comma separated)"
            />
          </div>

          {/* Time Logged (if editing) */}
          {task && task.time_logged !== undefined && (
            <div className="p-4 bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Time Logged:</span>
                <span className="font-semibold text-ink">{task.time_logged}h</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div>
            {task && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Delete Task
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
              disabled={createTask.isPending || updateTask.isPending}
            >
              {task ? 'Update' : 'Create'} Task
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
