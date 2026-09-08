import React from 'react';
import { ShieldCheck, Briefcase, ShoppingBag, ShieldAlert, ScanLine, Settings } from 'lucide-react';
import type { UserRole } from '../types/compliance';

export type AppTab = 'scanner' | 'issues';

interface HeaderProps {
  role: UserRole;
  currentUserName?: string | null;
  onRoleChange?: (role: UserRole) => void;
  activeTab?: AppTab;
  onTabChange?: (tab: AppTab) => void;
  issuesCount?: number;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  currentUserName,
  onRoleChange,
  activeTab,
  onTabChange,
  issuesCount,
  onSignOut,
}) => {
  return (
    <header className="border-b border-gray-200 bg-white no-print">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                LM Compliance Scanner
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                Rule Engine 2026
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Client-Side Legal Metrology Packaged Commodities (LMPC) Verification
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs: Scanner / Issues (only if onTabChange provided and not Consumer) */}
        {onTabChange && activeTab && role !== 'Consumer' && (
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onTabChange('scanner')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Scanner</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('issues')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'issues'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Issues</span>
              {issuesCount !== undefined && issuesCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full bg-rose-500 text-white font-bold">
                  {issuesCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Right Section: User Info / Role View Toggle and Optional Sign Out */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {currentUserName ? (
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                {currentUserName.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-800 leading-tight">{currentUserName}</p>
                <p className="text-[10px] text-gray-500 leading-tight">Role: {role}</p>
              </div>
            </div>
          ) : onRoleChange ? (
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
              <span className="text-xs font-medium text-gray-500 px-1 hidden md:inline">
                Role View:
              </span>
              <div className="relative inline-block">
                <select
                  value={role}
                  onChange={(e) => onRoleChange(e.target.value as UserRole)}
                  className="appearance-none bg-white text-gray-800 text-xs font-semibold pl-8 pr-8 py-1.5 rounded-md border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-xs transition-colors"
                  aria-label="Select User Role"
                >
                  <option value="Inspector">Inspector (Full Audit)</option>
                  <option value="Manufacturer">Manufacturer (Self-Audit)</option>
                  <option value="Consumer">Consumer (Quick View)</option>
                  <option value="Admin">Admin (Rules &amp; Stats)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-gray-500">
                  {role === 'Inspector' && <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
                  {role === 'Manufacturer' && <Briefcase className="w-3.5 h-3.5 text-indigo-600" />}
                  {role === 'Consumer' && <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />}
                  {role === 'Admin' && <Settings className="w-3.5 h-3.5 text-purple-600" />}
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400 text-[10px]">
                  ▼
                </div>
              </div>
            </div>
          ) : null}

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
