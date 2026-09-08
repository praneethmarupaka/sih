import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type AuthRole } from '../context/AuthContext';
import {
  authenticateUser,
  type ManufacturerRecord,
  type InspectorRecord,
} from '../utils/authCredentials';
import {
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  Settings,
  Briefcase,
  KeyRound,
  AlertCircle,
  Clock,
  XCircle,
  LogOut,
} from 'lucide-react';
import { ManufacturerRegistrationForm } from './ManufacturerRegistrationForm';
import { CustomerRegistrationForm } from './CustomerRegistrationForm';
import { InspectorRegistrationForm } from './InspectorRegistrationForm';

type LoginView =
  | 'login'
  | 'register_customer'
  | 'register_manufacturer'
  | 'register_inspector'
  | 'pending'
  | 'rejected'
  | 'inspector_pending'
  | 'inspector_rejected';

const ROLE_CONFIG: {
  role: AuthRole;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    role: 'Customer',
    label: 'Customer',
    icon: <UserCheck className="w-4 h-4 mb-1 text-emerald-600" />,
    color: 'emerald',
  },
  {
    role: 'Inspector',
    label: 'Inspector',
    icon: <ShieldAlert className="w-4 h-4 mb-1 text-blue-600" />,
    color: 'blue',
  },
  {
    role: 'Admin',
    label: 'Admin',
    icon: <Settings className="w-4 h-4 mb-1 text-purple-600" />,
    color: 'purple',
  },
  {
    role: 'Manufacturer',
    label: 'Manufacturer',
    icon: <Briefcase className="w-4 h-4 mb-1 text-amber-600" />,
    color: 'amber',
  },
];

function roleDashboard(role: AuthRole): string {
  switch (role) {
    case 'Customer': return '/customer/dashboard';
    case 'Inspector': return '/inspector/dashboard';
    case 'Admin': return '/admin/dashboard';
    case 'Manufacturer': return '/manufacturer/dashboard';
  }
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [view, setView] = useState<LoginView>('login');
  const [selectedRole, setSelectedRole] = useState<AuthRole>('Customer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingMfr, setPendingMfr] = useState<ManufacturerRecord | null>(null);
  const [rejectedMfr, setRejectedMfr] = useState<ManufacturerRecord | null>(null);
  const [pendingInsp, setPendingInsp] = useState<InspectorRecord | null>(null);
  const [rejectedInsp, setRejectedInsp] = useState<InspectorRecord | null>(null);

  const handleRoleChange = (newRole: AuthRole) => {
    setSelectedRole(newRole);
    setErrorMessage(null);
    setUsername('');
    setPassword('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter your username and password.');
      return;
    }

    const result = authenticateUser(selectedRole, username, password);

    if (result.success === true) {
      login(result.user);
      navigate(roleDashboard(result.user.role));
    } else if (result.success === 'manufacturer_pending') {
      setPendingMfr(result.manufacturer);
      setView('pending');
    } else if (result.success === 'manufacturer_rejected') {
      setRejectedMfr(result.manufacturer);
      setView('rejected');
    } else if (result.success === 'inspector_pending') {
      setPendingInsp(result.inspector);
      setView('inspector_pending');
    } else if (result.success === 'inspector_rejected') {
      setRejectedInsp(result.inspector);
      setView('inspector_rejected');
    } else if (result.success === false) {
      setErrorMessage(result.error);
    }
  };

  const handleLogout = () => {
    logout();
    setPendingMfr(null);
    setRejectedMfr(null);
    setPendingInsp(null);
    setRejectedInsp(null);
    setUsername('');
    setPassword('');
    setView('login');
  };

  // ── Customer registration form view ─────────────────────────────────────
  if (view === 'register_customer') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <CustomerRegistrationForm onBack={() => setView('login')} />
      </div>
    );
  }

  // ── Manufacturer registration form view ─────────────────────────────────
  if (view === 'register_manufacturer') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <ManufacturerRegistrationForm onBack={() => setView('login')} />
      </div>
    );
  }

  // ── Inspector registration form view ────────────────────────────────────
  if (view === 'register_inspector') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <InspectorRegistrationForm onBack={() => setView('login')} />
      </div>
    );
  }

  // ── Manufacturer pending approval screen ────────────────────────────────
  if (view === 'pending' && pendingMfr) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-slate-200 text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center border-2 border-amber-300">
              <Clock className="w-7 h-7" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Awaiting Approval</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your manufacturer registration is under review
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-1.5">
            <p className="text-xs font-semibold text-amber-900">
              Company: <span className="font-bold">{pendingMfr.companyName}</span>
            </p>
            <p className="text-xs text-amber-800">
              Submitted: {new Date(pendingMfr.submittedAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
            <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-200 text-amber-900 border border-amber-400">
              ● Pending Review
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Your registration is awaiting Admin approval. You will be able to access the dashboard once your account has been reviewed and approved.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Manufacturer rejected screen ────────────────────────────────────────
  if (view === 'rejected' && rejectedMfr) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-slate-200 text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center border-2 border-rose-300">
              <XCircle className="w-7 h-7" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Registration Rejected</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your manufacturer registration was not approved
            </p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-left space-y-1.5">
            <p className="text-xs font-semibold text-rose-900">
              Company: <span className="font-bold">{rejectedMfr.companyName}</span>
            </p>
            <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-rose-200 text-rose-900 border border-rose-400">
              ● Rejected
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Your registration has been reviewed and was not approved. Please contact the Legal Metrology Administration office for further information.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Inspector pending approval screen ───────────────────────────────────
  if (view === 'inspector_pending' && pendingInsp) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-slate-200 text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center border-2 border-amber-300">
              <Clock className="w-7 h-7" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Awaiting Approval</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your inspector registration is under review
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-1.5">
            <p className="text-xs font-semibold text-amber-900">
              Name: <span className="font-bold">{pendingInsp.fullName}</span>
            </p>
            <p className="text-xs text-amber-800">
              Inspector ID: <span className="font-mono font-semibold">{pendingInsp.inspectorId}</span>
            </p>
            <p className="text-xs text-amber-800">
              Submitted: {new Date(pendingInsp.submittedAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
            <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-200 text-amber-900 border border-amber-400">
              ● Pending Review
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Your registration is awaiting Admin approval. You will be able to access the Inspector dashboard once your account has been reviewed and approved.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Inspector rejected screen ───────────────────────────────────────────
  if (view === 'inspector_rejected' && rejectedInsp) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-slate-200 text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center border-2 border-rose-300">
              <XCircle className="w-7 h-7" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Registration Rejected</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your inspector registration was not approved
            </p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-left space-y-1.5">
            <p className="text-xs font-semibold text-rose-900">
              Name: <span className="font-bold">{rejectedInsp.fullName}</span>
            </p>
            <p className="text-xs text-rose-800">
              Inspector ID: <span className="font-mono font-semibold">{rejectedInsp.inspectorId}</span>
            </p>
            <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-rose-200 text-rose-900 border border-rose-400">
              ● Rejected
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Your registration has been reviewed and was not approved. Please contact the Legal Metrology Administration office for further information.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Main login view ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-slate-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">LM Compliance Scanner</h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in to access Legal Metrology packaged commodity compliance verification
          </p>
        </div>

        {/* Role Selector */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Role:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ROLE_CONFIG.map(({ role, label, icon }) => {
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {icon}
                  <span className="text-[10px] text-center leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                placeholder="Enter password"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Sign In as {selectedRole}
          </button>
        </form>

        {/* Customer registration link */}
        {selectedRole === 'Customer' && (
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              New customer?{' '}
              <button
                type="button"
                onClick={() => setView('register_customer')}
                className="text-emerald-600 hover:text-emerald-800 font-semibold underline cursor-pointer"
              >
                Register here
              </button>
            </p>
          </div>
        )}

        {/* Inspector registration link */}
        {selectedRole === 'Inspector' && (
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              New inspector?{' '}
              <button
                type="button"
                onClick={() => setView('register_inspector')}
                className="text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
              >
                Register here
              </button>
            </p>
          </div>
        )}

        {/* Manufacturer registration link */}
        {selectedRole === 'Manufacturer' && (
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              New manufacturer?{' '}
              <button
                type="button"
                onClick={() => setView('register_manufacturer')}
                className="text-amber-600 hover:text-amber-800 font-semibold underline cursor-pointer"
              >
                Register here
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
