import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Clock,
  TrendingDown,
} from 'lucide-react';
import { CATEGORY_RULES } from '../rules';
import type { ScanHistoryItem, UserRole } from '../types/compliance';
import type { AppPage } from './Sidebar';

import type { ComplianceIssue } from '../types/compliance';

interface DashboardProps {
  history: ScanHistoryItem[];
  issues?: ComplianceIssue[];
  role: UserRole;
  onNavigate: (page: AppPage) => void;
  onSignOut?: () => void;
}

const FIELD_LABEL_MAP: Record<string, string> = {
  manufacturerName: 'Manufacturer Name',
  mrp: 'MRP (Inclusive of Taxes)',
  netQuantity: 'Net Quantity',
  mfgDate: 'Date of Mfg / Pkd',
  consumerCare: 'Consumer Care Helpline',
  countryOfOrigin: 'Country of Origin',
  manufacturerAddress: 'Manufacturer Address',
};

function computeCommonViolations(
  history: ScanHistoryItem[],
  issues?: ComplianceIssue[]
): Array<{ label: string; count: number; total: number; isField: boolean }> {
  // If we have logged issues with fieldKey, prioritize showing which fields fail most often!
  if (issues && issues.length > 0) {
    const fieldCounts: Record<string, number> = {};
    for (const issue of issues) {
      const key = issue.fieldKey || 'other';
      fieldCounts[key] = (fieldCounts[key] || 0) + 1;
    }
    const totalIssues = issues.length;
    return Object.entries(fieldCounts)
      .map(([key, count]) => ({
        label: FIELD_LABEL_MAP[key] || key,
        count,
        total: totalIssues,
        isField: true,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // Fallback: derive category compliance gaps from scan history
  const catCounts: Record<string, { failures: number; total: number }> = {};
  for (const item of history) {
    const key = item.category;
    if (!catCounts[key]) catCounts[key] = { failures: 0, total: 0 };
    catCounts[key].total += 1;
    if (!item.isCompliant) catCounts[key].failures += 1;
  }

  return Object.entries(catCounts)
    .map(([label, { failures, total }]) => ({ label, count: failures, total, isField: false }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getScoreColor(score: number) {
  if (score === 100) return 'text-emerald-700';
  if (score >= 60) return 'text-amber-700';
  return 'text-rose-700';
}

function getStatusBadge(item: ScanHistoryItem) {
  if (item.score === 100)
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Compliant</span>;
  if (item.score >= 60)
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Warning</span>;
  return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300">Violation</span>;
}

export const Dashboard: React.FC<DashboardProps> = ({ history, issues, role, onNavigate, onSignOut }) => {
  // --- Stat card calculations ---
  const totalInspected = history.length;
  const compliantCount = history.filter((h) => h.score === 100).length;
  const compliantPct = totalInspected > 0 ? Math.round((compliantCount / totalInspected) * 100) : 0;

  const reviewCount = history.filter((h) => h.score < 100 && h.score >= 60).length;
  const violationCount = history.filter((h) => h.score < 60).length;
  const requiresReviewCount = reviewCount + violationCount;

  const activeCategories = Object.keys(CATEGORY_RULES).length;

  // Common violations (field-level from issues or category-level from history)
  const violations = computeCommonViolations(history, issues);
  const maxViolation = violations.length > 0 ? Math.max(...violations.map((v) => v.count)) : 1;
  const isFieldLevel = violations.length > 0 && violations[0].isField;

  // Recent inspections — last 5
  const recentScans = [...history].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Dashboard</h2>
            <p className="text-xs text-gray-500">
              {role === 'Admin' ? 'System-wide compliance overview' : 'Your compliance activity overview'}
            </p>
          </div>
        </div>

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-rose-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Logout
          </button>
        )}
      </div>

      {/* Stat Cards (4-up grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Products Inspected */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Products Inspected</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 tracking-tight">{totalInspected}</p>
          <p className="text-[11px] text-gray-400 mt-1">Total scans in history</p>
        </div>

        {/* 2. Compliant Products */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Compliant</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-700 tracking-tight">{compliantCount}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {totalInspected > 0 ? `${compliantPct}% pass rate` : 'No scans yet'}
          </p>
        </div>

        {/* 3. Requires Review */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Requires Review</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-700 tracking-tight">{requiresReviewCount}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {reviewCount} warnings · {violationCount} violations
          </p>
        </div>

        {/* 4. Active Rule Categories */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rule Categories</p>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-700 tracking-tight">{activeCategories}</p>
          <p className="text-[11px] text-gray-400 mt-1">Active in rule engine</p>
        </div>
      </div>

      {/* Bottom row: Common Violations + Recent Inspections */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Common Violations panel (2/5 width on large) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              {isFieldLevel ? 'Most Frequent Field Violations' : 'Common Violations by Category'}
            </h3>
          </div>

          {violations.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              <ShieldCheck className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
              No violations logged yet. Scans will populate compliance patterns.
            </div>
          ) : (
            <div className="space-y-3">
              {violations.map((v) => {
                const pct = maxViolation > 0 ? Math.round((v.count / maxViolation) * 100) : 0;
                return (
                  <div key={v.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-700 font-medium truncate pr-2">{v.label}</span>
                      <span className="text-xs font-bold text-rose-700 shrink-0">
                        {v.count} {isFieldLevel ? (v.count === 1 ? 'violation' : 'violations') : `/${v.total}`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-[10px] text-gray-400 pt-1">
                {isFieldLevel
                  ? 'Ranked frequency of declarations missing or non-compliant.'
                  : 'Shows non-compliant scans per category. Detailed field issues in Violations tab.'}
              </p>
            </div>
          )}
        </div>

        {/* Recent Inspections table (3/5 width) */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Recent Inspections</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('all-products')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentScans.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              No scans yet. Go to Product Inspections to run your first scan.
            </div>
          ) : (
            <div className="space-y-2">
              {recentScans.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-all"
                >
                  {/* Thumbnail */}
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt="Thumb"
                      className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-300 text-[10px] shrink-0">
                      N/A
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">{item.productName || 'Scanned Product'}</p>
                    <p className="text-[10px] text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                      <span>{item.category}</span>
                      <span>&bull;</span>
                      <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-medium">{role}</span>
                      <span>&bull;</span>
                      <span>{new Date(item.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold ${getScoreColor(item.score)}`}>{item.score}%</span>
                    {getStatusBadge(item)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
