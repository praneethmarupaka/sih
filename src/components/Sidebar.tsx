import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  Package,
  ShieldAlert,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Settings,
  LogOut,
} from 'lucide-react';
import type { UserRole } from '../rules';

export type AppPage =
  | 'dashboard'
  | 'scanner'
  | 'all-products'
  | 'violations'
  | 'rules'
  | 'reports';

interface NavItem {
  page: AppPage;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  role: UserRole;
  currentUserName?: string | null;
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  onRoleChange?: (role: UserRole) => void;
  onSignOut: () => void;
  issuesCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function getNavItems(role: UserRole, issuesCount: number): NavItem[] {
  const common: NavItem[] = [
    { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { page: 'scanner', label: 'Product Inspections', icon: <ScanLine className="w-4 h-4" /> },
    { page: 'all-products', label: 'All Products', icon: <Package className="w-4 h-4" /> },
  ];

  const inspectorItems: NavItem[] = [
    {
      page: 'violations',
      label: 'Violations',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: issuesCount > 0 ? issuesCount : undefined,
    },
    { page: 'rules', label: 'LMPC Rules', icon: <BookOpen className="w-4 h-4" /> },
    { page: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
  ];

  const adminItems: NavItem[] = [
    { page: 'rules', label: 'LMPC Rules', icon: <BookOpen className="w-4 h-4" /> },
    { page: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
  ];

  const manufacturerItems: NavItem[] = [
    { page: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
  ];

  if (role === 'Inspector') return [...common, ...inspectorItems];
  if (role === 'Admin') return [...common, ...adminItems];
  if (role === 'Manufacturer') return [...common, ...manufacturerItems];
  // Consumer: only common (but Consumer has no sidebar — this is a fallback)
  return common;
}

const roleIcon: Record<UserRole, React.ReactNode> = {
  Inspector: <ShieldCheck className="w-4 h-4 text-blue-500" />,
  Manufacturer: <Briefcase className="w-4 h-4 text-indigo-500" />,
  Consumer: <Package className="w-4 h-4 text-emerald-500" />,
  Admin: <Settings className="w-4 h-4 text-purple-500" />,
};

const roleLabel: Record<UserRole, string> = {
  Inspector: 'Inspector',
  Manufacturer: 'Manufacturer',
  Consumer: 'Consumer',
  Admin: 'Admin',
};

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  currentUserName,
  activePage,
  onNavigate,
  onRoleChange,
  onSignOut,
  issuesCount,
  collapsed,
  onToggleCollapse,
}) => {
  const navItems = getNavItems(role, issuesCount);

  return (
    <aside
      className={`no-print flex flex-col h-screen bg-slate-900 text-white transition-all duration-200 shrink-0 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo Row */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-slate-700/60">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-tight truncate">LM Compliance</p>
              <p className="text-[10px] text-slate-400 leading-tight truncate">Rule Engine 2026</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto p-1.5 bg-blue-600 text-white rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded ${collapsed ? 'hidden' : ''}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="mx-auto mt-2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded"
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePage === item.page;
          return (
            <button
              key={item.page}
              type="button"
              onClick={() => onNavigate(item.page)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}>
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge !== undefined && (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge !== undefined && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: User Card + Sign out */}
      <div className="border-t border-slate-700/60 px-2 py-3 space-y-2">
        {/* User profile info */}
        {!collapsed ? (
          <div className="px-2 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-slate-700">
                {roleIcon[role]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-100 truncate">
                  {currentUserName || roleLabel[role]}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {roleLabel[role]}
                  </span>
                </div>
              </div>
            </div>

            {onRoleChange && (
              <div className="mt-2 pt-1.5 border-t border-slate-700/50">
                <select
                  value={role}
                  onChange={(e) => onRoleChange(e.target.value as UserRole)}
                  className="w-full appearance-none bg-slate-900 text-slate-300 text-[11px] font-semibold px-2 py-1 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Inspector">Switch: Inspector</option>
                  <option value="Manufacturer">Switch: Manufacturer</option>
                  <option value="Consumer">Switch: Consumer</option>
                  <option value="Admin">Switch: Admin</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-1" title={`${currentUserName || roleLabel[role]} (${roleLabel[role]})`}>
            {roleIcon[role]}
          </div>
        )}

        {/* Sign out */}
        <button
          type="button"
          onClick={onSignOut}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
