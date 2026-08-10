'use client';

import { useState, useEffect } from 'react';
import { Bug, CreateBugDto, BugSeverity, BugPriority } from '@/types/bug';

interface BugModalProps {
  bug?: Bug;
  onClose: () => void;
  onSubmit: (data: CreateBugDto) => void;
  isLoading?: boolean;
}

export default function BugModal({ bug, onClose, onSubmit, isLoading }: BugModalProps) {
  const [formData, setFormData] = useState<CreateBugDto>({
    title: '',
    description: '',
    severity: 'medium' as BugSeverity,
    priority: 'medium' as BugPriority,
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    environment: '',
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (bug) {
      setFormData({
        title: bug.title,
        description: bug.description,
        severity: bug.severity,
        priority: bug.priority,
        assigneeId: bug.assigneeId,
        projectId: bug.projectId,
        epicId: bug.epicId,
        stepsToReproduce: bug.stepsToReproduce || '',
        expectedBehavior: bug.expectedBehavior || '',
        actualBehavior: bug.actualBehavior || '',
        environment: bug.environment || '',
        tags: bug.tags || [],
      });
    }
  }, [bug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || [],
    }));
  };

  return (
    <div className="fixed inset-0 bg-bg-inverse bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl my-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{bug ? 'Edit Bug' : 'Create New Bug'}</h2>
            <button
              onClick={onClose}
              className="text-ink-muted hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border-2 border-border focus:border-black outline-none"
                required
                placeholder="Brief description of the bug"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border-2 border-border focus:border-black outline-none"
                rows={3}
                required
                placeholder="Detailed description of the bug"
              />
            </div>

            {/* Severity and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Severity *</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as BugSeverity })}
                  className="w-full px-4 py-2 border-2 border-border focus:border-black outline-none"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as BugPriority })}
                  className="w-full px-4 py-2 border-2 border-border focus:border-black outline-none"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Steps to Reproduce */}
            <div>
              <label className="block text-sm font-semibold mb-2">Steps to Reproduce</label>
              <textarea
                value={formData.stepsToReproduce}
                onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                className="w-full px-4 py-2 border-2 border-border focus:border-black outline-none"
                rows={3}
                placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..."
              />
            </div>

            {/* Expected vs Actual Behavior */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Expected Behavior</label>
                <textarea
                  value={formData.expectedBehavior}
                  onChange={(e) => setFormData({ ...formData, expectedBehavior: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-border focus:border-black outline-none"
                  rows={2}
                  placeholder="What should happen"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Actual Behavior</label>
                <textarea
                  value={formData.actualBehavior}
                  onChange={(e) => setFormData({ ...formData, actualBehavior: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-border focus:border-black outline-none"
                  rows={2}
                  placeholder="What actually happens"
                />
              </div>
            </div>

            {/* Environment */}
            <div>
              <label className="block text-sm font-semibold mb-2">Environment</label>
              <input
                type="text"
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full px-4 py-2 border-2 border-border focus:border-black outline-none"
                placeholder="e.g., Chrome 120, Windows 11, Production"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 border-2 border-border focus:border-black outline-none"
                  placeholder="Add tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-bg-inverse text-ink hover:bg-bg-muted"
                >
                  Add
                </button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                    <span key={idx} className="bg-bg-inverse text-ink px-3 py-1 text-sm flex items-center gap-2">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-ink hover:text-ink-secondary font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border-2 border-black text-ink hover:bg-bg-muted"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-bg-inverse text-ink hover:bg-bg-muted disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : bug ? 'Update Bug' : 'Create Bug'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
