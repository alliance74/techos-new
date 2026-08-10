'use client';

import { DollarSign, Calendar, TrendingUp, User } from 'lucide-react';
import { Deal } from '@/types/crm';
import { Badge } from '@/components/UI/Badge';

interface DealCardProps {
  deal: Deal;
  onClick?: () => void;
}

export function DealCard({ deal, onClick }: DealCardProps) {
  const getStageColor = (stage: Deal['stage']) => {
    switch (stage) {
      case 'lead':
        return 'bg-bg-muted text-gray-800 border-border';
      case 'qualified':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'proposal':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'negotiation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'closed_won':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'closed_lost':
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 p-4 cursor-pointer hover:border-black transition-colors"
      draggable
    >
      <div className="space-y-3">
        {/* Title & Stage */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-ink flex-1">{deal.title}</h4>
          <Badge className={getStageColor(deal.stage)}>
            {deal.stage.replace('_', ' ')}
          </Badge>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-2 text-lg font-bold text-ink">
          <DollarSign className="h-5 w-5" />
          <span>{formatCurrency(deal.value, deal.currency)}</span>
        </div>

        {/* Probability */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="h-4 w-4" />
          <span>{deal.probability}% probability</span>
        </div>

        {/* Contact */}
        {deal.contact && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{deal.contact.name}</span>
          </div>
        )}

        {/* Expected Close Date */}
        {deal.expected_close_date && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Close: {formatDate(deal.expected_close_date)}</span>
          </div>
        )}

        {/* Description */}
        {deal.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{deal.description}</p>
        )}
      </div>
    </div>
  );
}
