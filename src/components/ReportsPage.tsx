import React, { useState } from 'react';
import { FileText, Printer, Search, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { ScanHistoryItem, UserRole } from '../types/compliance';

interface ReportsPageProps {
  history: ScanHistoryItem[];
  role: UserRole;
  onPrintScan: (item: ScanHistoryItem) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ history, role, onPrintScan }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter((item) => {
    return (
      (item.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getScoreBadge = (score: number) => {
    if (score === 100) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score >= 60) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Audit &amp; Inspection Reports</h2>
            <p className="text-xs text-gray-500">
              {role === 'Manufacturer'
                ? 'Export official self-audit compliance sheets for your retail packs'
                : 'Browse and generate printable formal inspection reports'}
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg self-start sm:self-auto">
          {history.length} Available {history.length === 1 ? 'Report' : 'Reports'}
        </span>
      </div>

      {/* Search Filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reports by product name or category..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-600">No reports found</p>
            <p className="mt-1">
              {history.length === 0
                ? 'Complete an inspection scan to generate your first printable report.'
                : 'No reports match your search query.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Inspection Date</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Compliance Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {new Date(item.timestamp).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Product Name */}
                    <td className="py-3 px-4 font-semibold text-gray-900 max-w-[200px] truncate">
                      {item.productName || 'Scanned Pack Label'}
                      <div className="text-[10px] text-gray-400 font-normal">
                        {item.passedCount} / {item.totalRequired} declarations verified
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-medium border border-gray-200 text-gray-700">
                        {item.category}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded-md border ${getScoreBadge(
                          item.score
                        )}`}
                      >
                        {item.score}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {item.isCompliant ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Compliant
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Non-Compliant
                        </span>
                      )}
                    </td>

                    {/* Print Button */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onPrintScan(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                        title="Print this inspection report"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Report</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
