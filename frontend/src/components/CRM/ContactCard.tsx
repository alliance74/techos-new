'use client';

import { Mail, Phone, Building, User, Tag, TrendingUp } from 'lucide-react';
import { Contact } from '@/types/crm';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  const getScoreColor = (score?: number) => {
    if (!score) return 'bg-bg-muted text-ink-secondary';
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  return (
    <Card onClick={onClick} className="cursor-pointer hover:border-black transition-colors">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-ink">{contact.name}</h3>
              {contact.position && (
                <p className="text-sm text-gray-600">{contact.position}</p>
              )}
            </div>
          </div>
          {contact.lead_score !== undefined && (
            <Badge className={getScoreColor(contact.lead_score)}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {contact.lead_score}
            </Badge>
          )}
        </div>

        {/* Company */}
        {contact.company && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building className="h-4 w-4" />
            <span>{contact.company}</span>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-1">
          {contact.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <a
                href={`mailto:${contact.email}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-ink"
              >
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <a
                href={`tel:${contact.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-ink"
              >
                {contact.phone}
              </a>
            </div>
          )}
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-3 w-3 text-ink-muted" />
            {contact.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-bg-muted text-ink-secondary border border-gray-200"
              >
                {tag}
              </span>
            ))}
            {contact.tags.length > 3 && (
              <span className="text-xs text-ink-muted">+{contact.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
