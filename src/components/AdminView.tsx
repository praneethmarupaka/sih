import React, { useState, useEffect } from 'react';
import {
  Settings,
  BarChart2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Briefcase,
  Users,
  ShieldAlert,
  Plus,
  Trash2,
  AlertCircle,
  FolderPlus,
} from 'lucide-react';
import { CATEGORY_RULES, type Category } from '../rules';
import type { ScanHistoryItem } from '../types/compliance';
import {
  getManufacturers,
  updateManufacturerStatus,
  type ManufacturerRecord,
  type ManufacturerStatus,
  getInspectors,
  updateInspectorStatus,
  type InspectorRecord,
  type InspectorStatus,
} from '../utils/authCredentials';
import {
  getEffectiveRules,
  getAllCategories,
  getCustomCategories,
  addRule,
  removeRule,
  addCustomCategory,
  isFieldNameActiveInCategory,
  generateRuleKey,
} from '../utils/rulesOverride';

interface AdminViewProps {
  history: ScanHistoryItem[];
  onSignOut?: () => void;
}

type MfrFilter = 'All' | ManufacturerStatus;
type InspFilter = 'All' | InspectorStatus;

const STATUS_COLORS: Record<ManufacturerStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-300',
  Approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Rejected: 'bg-rose-100 text-rose-800 border-rose-300',
};

const STATUS_DOT: Record<ManufacturerStatus, string> = {
  Pending: 'bg-amber-500',
  Approved: 'bg-emerald-500',
  Rejected: 'bg-rose-500',
};

export const AdminView: React.FC<AdminViewProps> = ({ history, onSignOut }) => {
  const totalScans = history.length;
  const avgScore =
    totalScans > 0
      ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / totalScans)
      : 0;
  const compliantCount = history.filter((h) => h.isCompliant).length;

  const [manufacturers, setManufacturers] = useState<ManufacturerRecord[]>([]);
  const [mfrFilter, setMfrFilter] = useState<MfrFilter>('All');
  const [inspectors, setInspectors] = useState<InspectorRecord[]>([]);
  const [inspFilter, setInspFilter] = useState<InspFilter>('All');

  useEffect(() => {
    setManufacturers(getManufacturers());
    setInspectors(getInspectors());
  }, []);

  const handleApprove = (id: string) => {
    updateManufacturerStatus(id, 'Approved');
    setManufacturers(getManufacturers());
  };

  const handleReject = (id: string) => {
    updateManufacturerStatus(id, 'Rejected');
    setManufacturers(getManufacturers());
  };

  const handleApproveInspector = (id: string) => {
    updateInspectorStatus(id, 'Approved');
    setInspectors(getInspectors());
  };

  const handleRejectInspector = (id: string) => {
    updateInspectorStatus(id, 'Rejected');
    setInspectors(getInspectors());
  };

  // ── Rules Management State ────────────────────────────────────────────────
  const [, setRulesVersion] = useState(0);
  const [addingRuleForCat, setAddingRuleForCat] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [newRuleRef, setNewRuleRef] = useState('');
  const [newRequired, setNewRequired] = useState(true);
  const [ruleFormError, setRuleFormError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ category: string; key: string } | null>(null);

  // Category addition state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catFormError, setCatFormError] = useState<string | null>(null);

  const handleOpenAddRule = (cat: string) => {
    setAddingRuleForCat(cat);
    setNewFieldName('');
    setNewRuleRef('');
    setNewRequired(true);
    setRuleFormError(null);
  };

  const handleSaveRule = (cat: string) => {
    const trimmedLabel = newFieldName.trim();
    if (!trimmedLabel) {
      setRuleFormError('Field Name is required.');
      return;
    }
    if (isFieldNameActiveInCategory(cat, trimmedLabel)) {
      setRuleFormError(`A rule with the field name "${trimmedLabel}" already exists in this category.`);
      return;
    }
    const key = generateRuleKey(trimmedLabel, cat);
    addRule(cat, {
      key,
      label: trimmedLabel,
      required: newRequired,
      ruleReference: newRuleRef.trim() || undefined,
      suggestionIfMissing: `Declare ${trimmedLabel} clearly on product packaging.`,
    });
    setAddingRuleForCat(null);
    setNewFieldName('');
    setNewRuleRef('');
    setRuleFormError(null);
    setRulesVersion((v) => v + 1);
  };

  const handleConfirmRemove = (cat: string, key: string) => {
    removeRule(cat, key);
    setConfirmRemove(null);
    setRulesVersion((v) => v + 1);
  };

  const handleCreateCategory = () => {
    const trimmedName = newCatName.trim();
    if (!trimmedName) {
      setCatFormError('Category name is required.');
      return;
    }
    const existingCats = getAllCategories();
    if (existingCats.some((c) => c.toLowerCase() === trimmedName.toLowerCase())) {
      setCatFormError('A category with this name already exists.');
      return;
    }
    addCustomCategory(trimmedName, newCatDesc.trim() || 'Custom product category');
    setIsAddingCategory(false);
    setNewCatName('');
    setNewCatDesc('');
    setCatFormError(null);
    setRulesVersion((v) => v + 1);
  };

  const pendingMfrs = manufacturers.filter((m) => m.status === 'Pending');
  const filteredMfrs =
    mfrFilter === 'All'
      ? manufacturers
      : manufacturers.filter((m) => m.status === mfrFilter);

  const pendingInsps = inspectors.filter((i) => i.status === 'Pending');
  const filteredInsps =
    inspFilter === 'All'
      ? inspectors
      : inspectors.filter((i) => i.status === inspFilter);

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
              Rule specifications, scan analytics, manufacturer approvals, and system accounts
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Scans</p>
            <p className="text-3xl font-black text-gray-900 tracking-tight">{totalScans}</p>
            <p className="text-[11px] text-gray-400 mt-1">
              {compliantCount} compliant ({totalScans > 0 ? Math.round((compliantCount / totalScans) * 100) : 0}%)
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BarChart2 className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Avg Compliance Score</p>
            <p className="text-3xl font-black text-emerald-700 tracking-tight">
              {totalScans > 0 ? `${avgScore}%` : 'N/A'}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Across all historical scans</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Approvals</p>
            <p className="text-3xl font-black text-amber-700 tracking-tight">{pendingMfrs.length + pendingInsps.length}</p>
            <p className="text-[11px] text-gray-400 mt-1">Manufacturers & Inspectors</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Pending Manufacturers Approval Queue ── */}
      {pendingMfrs.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Pending Manufacturer Approvals
                </h3>
                <p className="text-xs text-gray-500">Review and approve or reject new registrations</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-300">
              {pendingMfrs.length} Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-amber-50/70 border-b border-amber-100">
                  <th className="text-left px-3 py-2 font-bold text-amber-900">Company</th>
                  <th className="text-left px-3 py-2 font-bold text-amber-900">Contact</th>
                  <th className="text-left px-3 py-2 font-bold text-amber-900">Email</th>
                  <th className="text-left px-3 py-2 font-bold text-amber-900">Phone</th>
                  <th className="text-left px-3 py-2 font-bold text-amber-900">License No.</th>
                  <th className="text-left px-3 py-2 font-bold text-amber-900">Submitted</th>
                  <th className="text-left px-3 py-2 font-bold text-amber-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {pendingMfrs.map((mfr) => (
                  <tr key={mfr.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-3 py-2.5 font-semibold text-gray-900">{mfr.companyName}</td>
                    <td className="px-3 py-2.5 text-gray-700">{mfr.contactPersonName}</td>
                    <td className="px-3 py-2.5 text-gray-600">{mfr.email}</td>
                    <td className="px-3 py-2.5 text-gray-600">{mfr.phone}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-700">{mfr.licenseNumber}</td>
                    <td className="px-3 py-2.5 text-gray-500">
                      {new Date(mfr.submittedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(mfr.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(mfr.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── All Manufacturers ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-gray-600" />
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">All Manufacturers</h3>
              <p className="text-xs text-gray-500">Registered manufacturer accounts and their approval status</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(['All', 'Pending', 'Approved', 'Rejected'] as MfrFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setMfrFilter(f)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                  mfrFilter === f
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {manufacturers.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No manufacturers registered yet.</p>
        ) : filteredMfrs.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No manufacturers with status "{mfrFilter}".</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-3 py-2 font-bold text-gray-600">Company</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-600">Contact</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-600">License No.</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-600">Submitted</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-600">Status</th>
                  {(mfrFilter === 'All' || mfrFilter === 'Pending') && (
                    <th className="text-left px-3 py-2 font-bold text-gray-600">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMfrs.map((mfr) => (
                  <tr key={mfr.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-2.5 font-semibold text-gray-900">{mfr.companyName}</td>
                    <td className="px-3 py-2.5 text-gray-700">
                      <div>{mfr.contactPersonName}</div>
                      <div className="text-[10px] text-gray-400">{mfr.email}</div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-gray-700">{mfr.licenseNumber}</td>
                    <td className="px-3 py-2.5 text-gray-500">
                      {new Date(mfr.submittedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full border ${STATUS_COLORS[mfr.status]}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[mfr.status]}`} />
                        {mfr.status}
                      </span>
                    </td>
                    {(mfrFilter === 'All' || mfrFilter === 'Pending') && (
                      <td className="px-3 py-2.5">
                        {mfr.status === 'Pending' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApprove(mfr.id)}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(mfr.id)}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pending Inspectors Approval Queue ── */}
      {pendingInsps.length > 0 && (
        <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Pending Inspector Approvals
                </h3>
                <p className="text-xs text-gray-500">Review and approve or reject new inspector registrations</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-300">
              {pendingInsps.length} Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-blue-50/70 border-b border-blue-100">
                  <th className="text-left px-3 py-2 font-bold text-blue-900">Inspector</th>
                  <th className="text-left px-3 py-2 font-bold text-blue-900">Inspector ID</th>
                  <th className="text-left px-3 py-2 font-bold text-blue-900">Email</th>
                  <th className="text-left px-3 py-2 font-bold text-blue-900">Phone</th>
                  <th className="text-left px-3 py-2 font-bold text-blue-900">Department</th>
                  <th className="text-left px-3 py-2 font-bold text-blue-900">Submitted</th>
                  <th className="text-left px-3 py-2 font-bold text-blue-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {pendingInsps.map((insp) => (
                  <tr key={insp.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-3 py-2.5 font-semibold text-gray-900">{insp.fullName}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-700">{insp.inspectorId}</td>
                    <td className="px-3 py-2.5 text-gray-600">{insp.email}</td>
                    <td className="px-3 py-2.5 text-gray-600">{insp.phone}</td>
                    <td className="px-3 py-2.5 text-gray-600">{insp.department}</td>
                    <td className="px-3 py-2.5 text-gray-500">
                      {new Date(insp.submittedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveInspector(insp.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectInspector(insp.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── All Inspectors ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-gray-600" />
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">All Inspectors</h3>
              <p className="text-xs text-gray-500">Registered inspector accounts and their approval status</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(['All', 'Pending', 'Approved', 'Rejected'] as InspFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setInspFilter(f)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                  inspFilter === f
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {inspectors.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No inspectors registered yet.</p>
        ) : filteredInsps.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No inspectors with status "{inspFilter}".</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-3 py-2 font-bold text-gray-600">Inspector</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-600">Inspector ID</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-600">Email</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-600">Phone</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-600">Department</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-600">Submitted</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-600">Status</th>
                  {(inspFilter === 'All' || inspFilter === 'Pending') && (
                    <th className="text-left px-3 py-2 font-bold text-gray-600">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInsps.map((insp) => (
                  <tr key={insp.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-2.5 font-semibold text-gray-900">{insp.fullName}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-700">{insp.inspectorId}</td>
                    <td className="px-3 py-2.5 text-gray-600">{insp.email}</td>
                    <td className="px-3 py-2.5 text-gray-600">{insp.phone}</td>
                    <td className="px-3 py-2.5 text-gray-600">{insp.department}</td>
                    <td className="px-3 py-2.5 text-gray-500">
                      {new Date(insp.submittedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full border ${STATUS_COLORS[insp.status]}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[insp.status]}`} />
                        {insp.status}
                      </span>
                    </td>
                    {(inspFilter === 'All' || inspFilter === 'Pending') && (
                      <td className="px-3 py-2.5">
                        {insp.status === 'Pending' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApproveInspector(insp.id)}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectInspector(insp.id)}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LMPC Rule Specifications & Management */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Legal Metrology Category Rule Management
            </h3>
            <p className="text-xs text-gray-500">
              Manage category rules, add custom rules, or remove existing requirements. Overrides are layered over baseline rules in localStorage.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              {getAllCategories().length} Categories
            </span>
            <button
              type="button"
              onClick={() => {
                setIsAddingCategory(!isAddingCategory);
                setCatFormError(null);
                setNewCatName('');
                setNewCatDesc('');
              }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Add Category
            </button>
          </div>
        </div>

        {/* Inline Add Category Form */}
        {isAddingCategory && (
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 text-sm">Add New Product Category</span>
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                &times;
              </button>
            </div>
            {catFormError && (
              <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                <span>{catFormError}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    setCatFormError(null);
                  }}
                  placeholder="e.g. Health Supplements"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="e.g. Dietary supplements and nutraceutical commodities"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCreateCategory}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
              >
                Create Category
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getAllCategories().map((catKey) => {
            const isBuiltIn = catKey in CATEGORY_RULES;
            const config = isBuiltIn ? CATEGORY_RULES[catKey as Category] : null;
            const customCats = getCustomCategories();
            const customInfo = customCats.find((c) => c.name === catKey);

            const categoryTitle = config ? config.category : catKey;
            const categoryDesc = config
              ? config.description
              : (customInfo ? customInfo.description : 'Custom product category');

            const activeRules = getEffectiveRules(catKey, false);
            const importedRules = getEffectiveRules(catKey, true);
            const hasImportedDiff = importedRules.length !== activeRules.length;

            return (
              <div
                key={catKey}
                className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-bold text-gray-900">{categoryTitle}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      {activeRules.filter((r) => r.required).length} Mandatory
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{categoryDesc}</p>

                  <div className="space-y-2">
                    {activeRules.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-2">
                        No active rules configured for this category. Click below to add rules.
                      </p>
                    ) : (
                      activeRules.map((rule) => {
                        const isPendingConfirm =
                          confirmRemove?.category === catKey && confirmRemove?.key === rule.key;

                        return (
                          <div
                            key={rule.key}
                            className="bg-white rounded-lg border border-gray-200 p-2.5 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-gray-800">{rule.label}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                    rule.required
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  {rule.required ? 'Mandatory' : 'Optional (QR)'}
                                </span>

                                {isPendingConfirm ? (
                                  <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                    <span className="text-[10px] text-rose-700 font-bold">Remove?</span>
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmRemove(catKey, rule.key)}
                                      className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmRemove(null)}
                                      className="text-[10px] bg-gray-200 hover:bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                               ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmRemove({ category: catKey, key: rule.key })}
                                    title="Remove rule"
                                    className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {rule.mustContainPhrase && (
                              <p className="text-[11px] text-amber-800 font-medium">
                                &bull; Must contain: <code className="bg-amber-50 px-1 rounded font-mono">"{rule.mustContainPhrase}"</code> ({rule.ruleReference})
                              </p>
                            )}

                            {rule.ruleReference && !rule.mustContainPhrase && (
                              <p className="text-[11px] text-gray-600 font-medium">
                                &bull; Reference: <span className="font-mono text-gray-800">{rule.ruleReference}</span>
                              </p>
                            )}

                            {rule.notes && <p className="text-[11px] text-blue-700 italic">&bull; {rule.notes}</p>}
                            <p className="text-[11px] text-gray-500">
                              Template: <span className="italic text-gray-600">{rule.suggestionIfMissing}</span>
                            </p>
                          </div>
                        );
                      })
                    )}

                    {hasImportedDiff && (
                      <div className="bg-indigo-50/50 rounded-lg border border-indigo-200 p-2 text-xs text-indigo-900">
                        <strong className="font-semibold">When Imported:</strong> adds mandatory{' '}
                        <code className="font-mono text-[11px]">countryOfOrigin</code> under Rule 6(1)(n).
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Add Rule Form or Add Rule Button */}
                <div className="pt-2 border-t border-gray-200/60">
                  {addingRuleForCat === catKey ? (
                    <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs space-y-2.5">
                      <div className="flex items-center justify-between font-bold text-blue-900">
                        <span>Add New Rule</span>
                        <button
                          type="button"
                          onClick={() => setAddingRuleForCat(null)}
                          className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>

                      {ruleFormError && (
                        <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                          <span>{ruleFormError}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                          Field Name *
                        </label>
                        <input
                          type="text"
                          value={newFieldName}
                          onChange={(e) => {
                            setNewFieldName(e.target.value);
                            setRuleFormError(null);
                          }}
                          placeholder="e.g. Batch Number, FSSAI License"
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                          Rule Reference (optional)
                        </label>
                        <input
                          type="text"
                          value={newRuleRef}
                          onChange={(e) => setNewRuleRef(e.target.value)}
                          placeholder="e.g. Rule 6(1)(d), FSSAI Reg 2.2.1"
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <input
                          type="checkbox"
                          id={`req-${catKey}`}
                          checked={newRequired}
                          onChange={(e) => setNewRequired(e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`req-${catKey}`}
                          className="text-xs font-medium text-gray-700 cursor-pointer select-none"
                        >
                          Mandatory Requirement (Checked = Required)
                        </label>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSaveRule(catKey)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors cursor-pointer"
                        >
                          Save Rule
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingRuleForCat(null)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenAddRule(catKey)}
                      className="w-full py-2 border border-dashed border-gray-300 hover:border-blue-400 bg-white hover:bg-blue-50/40 text-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Rule to {catKey}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Accounts */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-600" />
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                System Accounts &amp; Authorized Personnel
              </h3>
              <p className="text-xs text-gray-500">Role-based access credentials</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
            System Accounts
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Self-Registered Users', role: 'Customer', desc: 'Consumer Self-Compliance Accounts', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
            { name: 'Rajesh Verma', role: 'Inspector', desc: 'Legal Metrology Field Officer', badge: 'bg-blue-100 text-blue-800 border-blue-300' },
            { name: 'Director General', role: 'Admin', desc: 'Central Governance Administrator', badge: 'bg-purple-100 text-purple-800 border-purple-300' },
          ].map((acc) => (
            <div key={acc.role} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-xs">{acc.name}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${acc.badge}`}>{acc.role}</span>
              </div>
              <p className="text-xs text-gray-500">{acc.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
