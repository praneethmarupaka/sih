import React, { useState } from 'react';
import { Trash2, ShieldAlert, Filter } from 'lucide-react';
import type { ComplianceIssue, IssueStatus } from '../types/compliance';

interface IssuesListProps {
  issues: ComplianceIssue[];
  onStatusChange: (id: string, status: IssueStatus) => void;
  onCommentsChange: (id: string, comments: string) => void;
  onDeleteIssue: (id: string) => void;
}

export const IssuesList: React.FC<IssuesListProps> = ({
  issues,
  onStatusChange,
  onCommentsChange,
  onDeleteIssue,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredIssues = issues.filter((issue) => {
    if (filterStatus === 'ALL') return true;
    return issue.status === filterStatus;
  });

  const countOpen = issues.filter((i) => i.status === 'Open').length;
  const countReview = issues.filter((i) => i.status === 'Under Review').length;
  const countResolved = issues.filter((i) => i.status === 'Resolved').length;

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'Open':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  if (issues.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          No Compliance Issues Logged
        </h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          As an Inspector, whenever a product packaging violation is detected during a scan, click
          the <strong className="text-gray-700">"Create Issue"</strong> button on the report card
          to log and track regulatory notices here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
      {/* Summary KPI Strip */}
      <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            <span>Inspector Compliance Issue Tracker</span>
          </h2>
          <p className="text-xs text-gray-500">
            Persistent local record of formal notices and packaging violations
          </p>
        </div>

        {/* Quick Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-semibold bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Issues ({issues.length})</option>
            <option value="Open">Open ({countOpen})</option>
            <option value="Under Review">Under Review ({countReview})</option>
            <option value="Resolved">Resolved ({countResolved})</option>
          </select>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-3 border-b border-gray-100 text-center py-3 bg-white">
        <div className="border-r border-gray-100">
          <span className="text-lg font-black text-rose-600">{countOpen}</span>
          <p className="text-[10px] uppercase font-bold text-gray-400">Open</p>
        </div>
        <div className="border-r border-gray-100">
          <span className="text-lg font-black text-amber-600">{countReview}</span>
          <p className="text-[10px] uppercase font-bold text-gray-400">Under Review</p>
        </div>
        <div>
          <span className="text-lg font-black text-emerald-600">{countResolved}</span>
          <p className="text-[10px] uppercase font-bold text-gray-400">Resolved</p>
        </div>
      </div>

      {/* Issues Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-200 uppercase font-semibold text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Issue ID</th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Violation Details</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Inspector Comments</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-sans">
            {filteredIssues.map((issue) => (
              <tr key={issue.id} className="hover:bg-gray-50/50 transition-colors">
                {/* ID */}
                <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                  {issue.id}
                  <div className="text-[10px] text-gray-400 font-normal">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </div>
                </td>

                {/* Product Name & Category */}
                <td className="py-3 px-4 font-semibold text-gray-900 max-w-[160px] truncate">
                  {issue.productName}
                  <div className="text-[10px] text-gray-400 font-normal truncate">
                    {issue.category}
                  </div>
                </td>

                {/* Violation Details */}
                <td className="py-3 px-4 max-w-[220px]">
                  <p className="text-rose-700 font-medium break-words leading-snug">
                    {issue.violation}
                  </p>
                </td>

                {/* Status Dropdown */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <select
                    value={issue.status}
                    onChange={(e) => onStatusChange(issue.id, e.target.value as IssueStatus)}
                    className={`text-xs font-bold rounded-md px-2 py-1 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusBadge(
                      issue.status
                    )}`}
                  >
                    <option value="Open">Open</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </td>

                {/* Inspector Comments */}
                <td className="py-3 px-4 min-w-[220px]">
                  <input
                    type="text"
                    value={issue.inspectorComments}
                    onChange={(e) => onCommentsChange(issue.id, e.target.value)}
                    placeholder="Add inspector notes / notice ref..."
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete issue ${issue.id}?`)) {
                        onDeleteIssue(issue.id);
                      }
                    }}
                    className="text-gray-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                    title="Delete issue"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
