import React, { useState, useMemo } from 'react';
import { Package, Search, Trash2, ArrowUpDown, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { ScanHistoryItem } from '../types/compliance';

interface AllProductsPageProps {
  history: ScanHistoryItem[];
  onClearHistory: () => void;
  onSelectScan?: (item: ScanHistoryItem) => void;
}

type SortField = 'timestamp' | 'productName' | 'category' | 'score';
type SortOrder = 'asc' | 'desc';

export const AllProductsPage: React.FC<AllProductsPageProps> = ({
  history,
  onClearHistory,
  onSelectScan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const categories = useMemo(() => {
    return Array.from(new Set(history.map((h) => h.category)));
  }, [history]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    return history
      .filter((item) => {
        const matchesSearch =
          (item.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

        const matchesStatus =
          statusFilter === 'ALL' ||
          (statusFilter === 'Compliant' && item.isCompliant) ||
          (statusFilter === 'Non-Compliant' && !item.isCompliant);

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        let valA: string | number = a[sortField];
        let valB: string | number = b[sortField];

        if (sortField === 'productName') {
          valA = (a.productName || '').toLowerCase();
          valB = (b.productName || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [history, searchTerm, categoryFilter, statusFilter, sortField, sortOrder]);

  const getScoreBadge = (score: number) => {
    if (score === 100) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score >= 60) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">All Products Directory</h2>
            <p className="text-xs text-gray-500">
              Complete history of inspected products with search, sorting, and compliance records
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
            title="Clear all stored products"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name or category..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Compliant">Compliant Only</option>
            <option value="Non-Compliant">Non-Compliant</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {filteredAndSorted.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-600">No matching products found</p>
            <p className="mt-1">
              {history.length === 0
                ? 'No inspections have been saved yet.'
                : 'Try adjusting your search query or filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Thumbnail</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('productName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Product Name</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Category</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('score')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Score</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Status</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('timestamp')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Date Inspected</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSorted.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectScan?.(item)}
                    className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <td className="py-3 px-4">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt="Thumb"
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-gray-100 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] shrink-0">
                          N/A
                        </div>
                      )}
                    </td>

                    {/* Product Name */}
                    <td className="py-3 px-4 font-semibold text-gray-900 max-w-[200px] truncate">
                      {item.productName || 'Scanned Pack Label'}
                      <div className="text-[10px] text-gray-400 font-normal">
                        {item.passedCount} of {item.totalRequired} rules passed
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-gray-600">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-medium border border-gray-200">
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

                    {/* Date */}
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {new Date(item.timestamp).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
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
