'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Deal } from '@/types/crm';
import { DealCard } from './DealCard';
import { useUpdateDeal } from '@/hooks/useCRM';

interface DealPipelineProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onCreateDeal: (stage: Deal['stage']) => void;
}

export function DealPipeline({ deals, onDealClick, onCreateDeal }: DealPipelineProps) {
  const updateDeal = useUpdateDeal();

  const stages: { id: Deal['stage']; title: string; color: string }[] = [
    { id: 'lead', title: 'Lead', color: 'border-border' },
    { id: 'qualified', title: 'Qualified', color: 'border-blue-500' },
    { id: 'proposal', title: 'Proposal', color: 'border-purple-500' },
    { id: 'negotiation', title: 'Negotiation', color: 'border-yellow-500' },
    { id: 'closed_won', title: 'Closed Won', color: 'border-green-500' },
    { id: 'closed_lost', title: 'Closed Lost', color: 'border-red-500' },
  ];

  const getDealsByStage = (stage: Deal['stage']) => {
    return deals?.filter(deal => deal.stage === stage) || [];
  };

  const getStageTotalValue = (stage: Deal['stage']) => {
    const stageDeals = getDealsByStage(stage);
    return stageDeals.reduce((sum, deal) => sum + deal.value, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    e.dataTransfer.setData('dealId', deal.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStage: Deal['stage']) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    
    const deal = deals?.find(d => d.id === dealId);
    if (deal && deal.stage !== newStage) {
      await updateDeal.mutateAsync({
        id: dealId,
        data: { stage: newStage },
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stages.map((stage) => {
        const stageDeals = getDealsByStage(stage.id);
        const totalValue = getStageTotalValue(stage.id);

        return (
          <div key={stage.id} className="flex flex-col">
            {/* Stage Header */}
            <div className={`border-t-4 ${stage.color} bg-white p-4 mb-3 border border-gray-200`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-ink text-sm">{stage.title}</h3>
                <button
                  onClick={() => onCreateDeal(stage.id)}
                  className="text-ink-muted hover:text-ink"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs text-ink-muted">
                {stageDeals.length} deals · {formatCurrency(totalValue)}
              </div>
            </div>

            {/* Deals Column */}
            <div
              className="flex-1 space-y-3 min-h-[400px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {stageDeals.map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, deal)}
                  onClick={() => onDealClick(deal)}
                >
                  <DealCard deal={deal} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
