'use client';

import { useState } from 'react';
import { Filter, Loader2 } from 'lucide-react';
import RecommendationCard from './RecommendationCard';
import type { PricingRecommendation } from '@/types';

interface RecommendationFeedProps {
  initialRecommendations: PricingRecommendation[];
}

export default function RecommendationFeed({
  initialRecommendations,
}: RecommendationFeedProps) {
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [filter, setFilter] = useState<string>('pending');
  const [loading, setLoading] = useState<string | null>(null);

  const filteredRecs = filter === 'all'
    ? recommendations
    : recommendations.filter((r) => r.status === filter);

  const handleApprove = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch('/api/pricing/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation_id: id, action: 'approved' }),
      });

      if (res.ok) {
        setRecommendations((prev) =>
          prev.filter((r) => r.id !== id)
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const handleModify = async (id: string, price: number) => {
    setLoading(id);
    try {
      const res = await fetch('/api/pricing/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation_id: id, action: 'modified', modified_price: price }),
      });

      if (res.ok) {
        setRecommendations((prev) =>
          prev.filter((r) => r.id !== id)
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch('/api/pricing/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation_id: id, action: 'rejected' }),
      });

      if (res.ok) {
        setRecommendations((prev) =>
          prev.filter((r) => r.id !== id)
        );
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <div className="flex gap-1 rounded-lg border border-gray-200 p-1">
            {[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {filteredRecs.length} recommendation{filteredRecs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Recommendation Cards */}
      {filteredRecs.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredRecs.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onApprove={handleApprove}
              onModify={handleModify}
              onReject={handleReject}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <Loader2 className="mb-3 h-8 w-8 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">No recommendations to review</p>
          <p className="text-sm text-gray-400">
            {filter === 'pending'
              ? 'AI recommendations will appear here once generated.'
              : 'No items match this filter.'}
          </p>
        </div>
      )}
    </div>
  );
}
