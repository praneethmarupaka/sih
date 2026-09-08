import React from 'react';
import { Settings, BarChart2, ShieldCheck } from 'lucide-react';
import { CATEGORY_RULES, type Category } from '../rules';
import type { ScanHistoryItem } from '../types/compliance';

interface AdminViewProps {
  history: ScanHistoryItem[];
  onSignOut?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ history, onSignOut }) => {
  // Compute basic analytics from scan history
  const totalScans = history.length;
  const avgScore =
    totalScans > 0
      ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / totalScans)
      : 0;
  const compliantCount = history.filter((h) => h.isCompliant).length;

  const categories = Object.keys(CATEGORY_RULES) as Category[];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Admin Governance &amp; Rule Engine Dashboard
            </h2>
            <p className="text-xs text-gray-500">
              Read-only Legal Metrology rule specifications, aggregate scan analytics, and users
            </p>
          </div>
        </div>

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-rose-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
          >
            Logout
          </button>
        )}
      </div>

      {/* Feature 5(b): 2 Simple Summary Stat Cards pulling from scan history */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Stat Card 1: Total Scans */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Total Scans
            </p>
            <p className="text-3xl font-black text-gray-900 tracking-tight">{totalScans}</p>
            <p className="text-[11px] text-gray-400 mt-1">
              {compliantCount} compliant ({totalScans > 0 ? Math.round((compliantCount / totalScans) * 100) : 0}%)
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BarChart2 className="w-6 h-6" />
          </div>
        </div>

        {/* Stat Card 2: Average Compliance Score */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Average Compliance Score
            </p>
            <p className="text-3xl font-black text-emerald-700 tracking-tight">
              {totalScans > 0 ? `${avgScore}%` : 'N/A'}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Across all historical evaluations in localStorage
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Feature 5(a): Read-only Display of rules.ts Categories and Required Fields */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Legal Metrology Category Rule Specifications
            </h3>
            <p className="text-xs text-gray-500">
              Hardcoded rule matrix configured in <code className="text-[11px] bg-gray-100 px-1 py-0.5 rounded">src/rules.ts</code>
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
            {categories.length} Categories Configured
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((catKey) => {
            const config = CATEGORY_RULES[catKey];
            const domesticRules = config.getRules(false);
            const importedRules = config.getRules(true);
            const hasImportedDifference = importedRules.length !== domesticRules.length;

            return (
              <div
                key={catKey}
                className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-bold text-gray-900">{config.category}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      {domesticRules.filter((r) => r.required).length} Mandatory
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{config.description}</p>

                  <div className="space-y-2">
                    {domesticRules.map((rule) => (
                      <div
                        key={rule.key}
                        className="bg-white rounded-lg border border-gray-200 p-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">{rule.label}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              rule.required
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {rule.required ? 'Mandatory' : 'Optional (QR)'}
                          </span>
                        </div>

                        {rule.mustContainPhrase && (
                          <p className="text-[11px] text-amber-800 font-medium">
                            &bull; Must contain phrase: <code className="bg-amber-50 px-1 rounded font-mono">"{rule.mustContainPhrase}"</code> ({rule.ruleReference})
                          </p>
                        )}

                        {rule.notes && (
                          <p className="text-[11px] text-blue-700 italic">&bull; {rule.notes}</p>
                        )}

                        <p className="text-[11px] text-gray-500">
                          Template: <span className="italic text-gray-600">{rule.suggestionIfMissing}</span>
                        </p>
                      </div>
                    ))}

                    {/* Show Imported extra field note if applicable */}
                    {hasImportedDifference && (
                      <div className="bg-indigo-50/50 rounded-lg border border-indigo-200 p-2 text-xs text-indigo-900">
                        <strong className="font-semibold">When Imported Product:</strong> adds mandatory{' '}
                        <code className="font-mono text-[11px]">countryOfOrigin</code> under Rule 6(1)(n).
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Users Panel listing demo accounts */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              System Accounts &amp; Authorized Personnel
            </h3>
            <p className="text-xs text-gray-500">
              Role-based access credentials configured for Legal Metrology enforcement
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
            3 Active Accounts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 text-xs">Priya Sharma</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Customer
              </span>
            </div>
            <p className="text-xs text-gray-500">Retail Consumer Account</p>
            <div className="text-[11px] font-mono text-gray-600 bg-white p-2 rounded border border-gray-200">
              Username: <span className="font-bold text-gray-800">customer</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 text-xs">Rajesh Verma</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                Inspector
              </span>
            </div>
            <p className="text-xs text-gray-500">Legal Metrology Field Officer</p>
            <div className="text-[11px] font-mono text-gray-600 bg-white p-2 rounded border border-gray-200">
              Username: <span className="font-bold text-gray-800">inspector</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 text-xs">Director General</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                Admin
              </span>
            </div>
            <p className="text-xs text-gray-500">Central Governance Administrator</p>
            <div className="text-[11px] font-mono text-gray-600 bg-white p-2 rounded border border-gray-200">
              Username: <span className="font-bold text-gray-800">admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
