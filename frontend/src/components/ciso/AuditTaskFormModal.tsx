'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { Select } from '@/components/UI/Select';
import { TextArea } from '@/components/UI/TextArea';
import type {
  AuditTaskPayload,
  AuditTaskPriority,
  AuditTaskStatus,
  CisoAuditProject,
} from '@/hooks/useCiso';

const PRIORITY_OPTIONS: { value: AuditTaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const STATUS_OPTIONS: { value: AuditTaskStatus; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

interface AuditTaskFormModalProps {
  isOpen: boolean;
  title: string;
  audits: CisoAuditProject[];
  initial?: Partial<AuditTaskPayload>;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: AuditTaskPayload) => Promise<void> | void;
}

export function AuditTaskFormModal({
  isOpen,
  title,
  audits,
  initial,
  loading,
  onClose,
  onSubmit,
}: AuditTaskFormModalProps) {
  const [projectAuditId, setProjectAuditId] = useState(initial?.project_audit_id || '');
  const [taskTitle, setTaskTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [priority, setPriority] = useState<AuditTaskPriority>(initial?.priority || 'medium');
  const [status, setStatus] = useState<AuditTaskStatus>(initial?.status || 'todo');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!projectAuditId || !taskTitle.trim()) return;
    await onSubmit({
      project_audit_id: projectAuditId,
      title: taskTitle.trim(),
      description: description.trim() || undefined,
      priority,
      status,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Select
          label="Project audit"
          required
          value={projectAuditId}
          onChange={(e) => setProjectAuditId(e.target.value)}
        >
          <option value="">Select a project audit</option>
          {audits.map((audit) => (
            <option key={audit.id} value={audit.id}>
              {audit.name}
            </option>
          ))}
        </Select>
        <Input
          label="Task title"
          required
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="e.g. Review privileged accounts"
        />
        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What needs to be checked or completed"
          rows={4}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as AuditTaskPriority)}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as AuditTaskStatus)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        {audits.length === 0 && (
          <p className="text-sm text-warning">Create a project audit first, then add tasks to it.</p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={!projectAuditId || !taskTitle.trim()} loading={loading}>
            Save task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
