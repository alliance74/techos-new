'use client';

import { useEffect, useState } from 'react';
import { X, Mail, Phone, Building, User, Tag } from 'lucide-react';
import { useCreateContact, useUpdateContact, useDeleteContact } from '@/hooks/useCRM';
import { Contact } from '@/types/crm';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact;
}

export function ContactModal({ isOpen, onClose, contact }: ContactModalProps) {
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    tags: '',
    notes: '',
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        position: contact.position || '',
        tags: contact.tags?.join(', ') || '',
        notes: contact.notes || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        tags: '',
        notes: '',
      });
    }
  }, [contact, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
      position: formData.position || undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : undefined,
      notes: formData.notes || undefined,
    };

    try {
      if (contact) {
        await updateContact.mutateAsync({ id: contact.id, data: payload });
      } else {
        await createContact.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      // Error handled by mutation hooks
    }
  };

  const handleDelete = async () => {
    if (contact && window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact.mutateAsync(contact.id);
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
            {contact ? 'Edit Contact' : 'New Contact'}
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="John Doe"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          {/* Company & Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Company
              </label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Inc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Position
              </label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="CEO"
              />
            </div>
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
              placeholder="vip, enterprise, hot-lead (comma separated)"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-surface"
              placeholder="Additional information about this contact"
            />
          </div>

          {/* Lead Score (display only for existing contacts) */}
          {contact && contact.lead_score !== undefined && (
            <div className="p-4 bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink-secondary">Lead Score</span>
                <span className="text-2xl font-bold text-ink">{contact.lead_score}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div>
            {contact && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Delete Contact
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
              disabled={createContact.isPending || updateContact.isPending}
            >
              {contact ? 'Update' : 'Create'} Contact
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
