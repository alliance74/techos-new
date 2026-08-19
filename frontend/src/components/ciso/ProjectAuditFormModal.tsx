'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { Select } from '@/components/UI/Select';
import { TextArea } from '@/components/UI/TextArea';
import type { ProjectAuditPayload, ProjectAuditStatus } from '@/hooks/useCiso';

const STATUS_OPTIONS: { value: ProjectAuditStatus; label: string }[] = [
  { value: 'needed', label: 'Audit Needed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

interface ProjectAuditFormModalProps {
  isOpen: boolean;
  title: string;
  initial?: Partial<ProjectAuditPayload>;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: ProjectAuditPayload) => Promise<void> | void;
}

export function ProjectAuditFormModal({
  isOpen,
  title,
  initial,
  loading,
  onClose,
  onSubmit,
}: ProjectAuditFormModalProps) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [status, setStatus] = useState<ProjectAuditStatus>(initial?.status || 'needed');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      status,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Audit name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Q3 Access Control Review"
        />
        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this project audit covers"
          rows={4}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectAuditStatus)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()} loading={loading}>
            Save audit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
