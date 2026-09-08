import React from 'react';
import { ShieldCheck, Briefcase, ShoppingBag } from 'lucide-react';
import type { UserRole } from '../types/compliance';

interface HeaderProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({ role, onRoleChange }) => {
  return (
    <header className="border-b border-gray-200 bg-white no-print">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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

        {/* Feature 5: Role View Toggle in top corner */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-gray-50 p-1.5 rounded-lg border border-gray-200">
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
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-gray-500">
              {role === 'Inspector' && <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
              {role === 'Manufacturer' && <Briefcase className="w-3.5 h-3.5 text-indigo-600" />}
              {role === 'Consumer' && <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400 text-[10px]">
              ▼
            </div>
          </div>
          <span className="text-[11px] text-gray-400 hidden sm:inline px-1">
            {role === 'Inspector' && 'Detailed inspection & OCR'}
            {role === 'Manufacturer' && 'Guidance & remediation'}
            {role === 'Consumer' && 'Price & quantity only'}
          </span>
        </div>
      </div>
    </header>
  );
};
