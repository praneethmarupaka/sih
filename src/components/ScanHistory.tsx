import React from 'react';
import { History, Trash2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { ScanHistoryItem } from '../types/compliance';

interface ScanHistoryProps {
  history: ScanHistoryItem[];
  onClearHistory: () => void;
  onSelectScan?: (item: ScanHistoryItem) => void;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({
  history,
  onClearHistory,
}) => {
  if (history.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs text-center no-print">
        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
          <History className="w-5 h-5" />
        </div>
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          3. Scan History
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          No previous scans found in localStorage. Completed scans will appear here automatically.
        </p>
      </div>
    );
  }

  const getScoreBadge = (score: number) => {
    if (score === 100) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score >= 60) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs no-print">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-gray-600" />
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            3. Recent Scan History
          </h3>
          <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
            {history.length} {history.length === 1 ? 'scan' : 'scans'} saved
          </span>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-rose-600 transition-colors cursor-pointer"
          title="Clear all saved scans"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/70 transition-all gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Thumbnail */}
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt="Pack Thumbnail"
                  className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0 bg-gray-100"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400 text-xs shrink-0">
                  N/A
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 truncate">
                    {item.productName || 'Scanned Pack Label'}
                  </span>
                  <span className="text-[10px] text-gray-500 px-1.5 py-0.2 bg-gray-100 rounded border border-gray-200 truncate">
                    {item.category}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span>
                    {item.passedCount} / {item.totalRequired} fields compliant
                  </span>
                </div>
              </div>
            </div>

            {/* Score & Status */}
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getScoreBadge(
                  item.score
                )}`}
              >
                {item.score}%
              </span>

              <div className="hidden sm:block">
                {item.isCompliant ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Passed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Violations
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
