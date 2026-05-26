'use client';

import { useState } from 'react';
import { Check, X, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/format';

interface ApprovalActionsProps {
  recommendationId: string;
  onApprove: (id: string) => Promise<void>;
  onModify: (id: string, price: number) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  currentPrice: number;
  recommendedPrice: number;
}

export default function ApprovalActions({
  recommendationId,
  onApprove,
  onModify,
  onReject,
  currentPrice,
  recommendedPrice,
}: ApprovalActionsProps) {
  const [isModifying, setIsModifying] = useState(false);
  const [modifiedPrice, setModifiedPrice] = useState(recommendedPrice);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      if (action === 'approve') {
        await onApprove(recommendationId);
      } else if (action === 'reject') {
        await onReject(recommendationId);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleModify = async () => {
    setLoading('modify');
    try {
      await onModify(recommendationId, modifiedPrice);
      setIsModifying(false);
    } finally {
      setLoading(null);
    }
  };

  if (isModifying) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5">
          <span className="text-xs text-gray-500">Rp</span>
          <input
            type="number"
            value={modifiedPrice}
            onChange={(e) => setModifiedPrice(Number(e.target.value))}
            className="w-28 text-sm font-medium text-gray-900 outline-none"
            min={Math.round(currentPrice * 0.5)}
            max={Math.round(currentPrice * 2)}
            step={1000}
          />
        </div>
        <button
          onClick={handleModify}
          disabled={loading === 'modify'}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading === 'modify' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            'Save'
          )}
        </button>
        <button
          onClick={() => setIsModifying(false)}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsModifying(true)}
        disabled={loading !== null}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Pencil className="h-3.5 w-3.5" />
        Modify
      </button>
      <button
        onClick={() => handleAction('approve')}
        disabled={loading !== null}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50',
          loading === 'approve' ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
        )}
      >
        {loading === 'approve' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        Approve
      </button>
      <button
        onClick={() => handleAction('reject')}
        disabled={loading !== null}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50',
          loading === 'reject' ? 'bg-red-400' : 'bg-red-500 hover:bg-red-600'
        )}
      >
        {loading === 'reject' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <X className="h-3.5 w-3.5" />
        )}
        Reject
      </button>
    </div>
  );
}
