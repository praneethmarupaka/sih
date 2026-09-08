import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type AuthRole } from '../context/AuthContext';
import { authenticateDemoUser, DEMO_CREDENTIALS } from '../utils/authCredentials';
import { ShieldCheck, UserCheck, ShieldAlert, Settings, KeyRound, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<AuthRole>('Inspector');
  const [username, setUsername] = useState(DEMO_CREDENTIALS.Inspector.username);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.Inspector.passwordHashOrPlain);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleChange = (newRole: AuthRole) => {
    setSelectedRole(newRole);
    setErrorMessage(null);
    setUsername(DEMO_CREDENTIALS[newRole].username);
    setPassword(DEMO_CREDENTIALS[newRole].passwordHashOrPlain);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = authenticateDemoUser(selectedRole, username, password);

    if (!result.success || !result.user) {
      setErrorMessage(result.error || 'Authentication failed. Please check credentials.');
      return;
    }

    login(result.user);

    // Redirect to role-specific dashboard
    switch (result.user.role) {
      case 'Customer':
        navigate('/customer/dashboard');
        break;
      case 'Inspector':
        navigate('/inspector/dashboard');
        break;
      case 'Admin':
        navigate('/admin/dashboard');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-slate-200">
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
          <div className="grid grid-cols-3 gap-2">
            {(['Customer', 'Inspector', 'Admin'] as AuthRole[]).map((r) => {
              const isSelected = selectedRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {r === 'Customer' && <UserCheck className="w-4 h-4 mb-1 text-emerald-600" />}
                  {r === 'Inspector' && <ShieldAlert className="w-4 h-4 mb-1 text-blue-600" />}
                  {r === 'Admin' && <Settings className="w-4 h-4 mb-1 text-purple-600" />}
                  <span>{r}</span>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                placeholder="Enter password"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Demo account hint */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
            <span className="font-semibold text-slate-700">Demo Credentials ({selectedRole}):</span>
            <span className="font-mono ml-1.5 text-slate-800">
              {DEMO_CREDENTIALS[selectedRole].username} / {DEMO_CREDENTIALS[selectedRole].passwordHashOrPlain}
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Sign In as {selectedRole}
          </button>
        </form>
      </div>
    </div>
  );
};
