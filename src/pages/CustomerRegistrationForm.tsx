import React, { useState } from 'react';
import { ArrowLeft, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import {
  registerCustomer,
  isUsernameTakenBySystemUser,
  isUsernameTakenByManufacturer,
} from '../utils/authCredentials';

interface Props {
  onBack: () => void;
}

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  username: string;
  password: string;
  confirmPassword: string;
}

const EMPTY: FormState = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  username: '',
  password: '',
  confirmPassword: '',
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL BUG #2 FIX: FormField is declared at the MODULE LEVEL.
// Must NOT be declared inside the component body, preventing component
// remounting and focus loss after every keystroke.
// ─────────────────────────────────────────────────────────────────────────────
interface FormFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
  autoComplete?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  multiline = false,
  autoComplete,
}) => {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={onChange}
          rows={2}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 resize-none ${
            error ? 'border-rose-400' : 'border-slate-300'
          }`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full px-3.5 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 ${
            error ? 'border-rose-400' : 'border-slate-300'
          }`}
        />
      )}
      {error && (
        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export const CustomerRegistrationForm: React.FC<Props> = ({ onBack }) => {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitted, setSubmitted] = useState(false);
  const [registeredName, setRegisteredName] = useState('');

  // ─────────────────────────────────────────────────────────────────────────────
  // CRITICAL BUG #1 FIX: Pass e.target.value directly into state.
  // Never split(" "), trim on keystroke, or strip spaces so multi-word strings work.
  // ─────────────────────────────────────────────────────────────────────────────
  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const rawValue = e.target.value;
    setForm((prev) => ({ ...prev, [field]: rawValue }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<FormState> = {};

    if (!form.fullName.trim()) {
      errs.fullName = 'Full Name is required.';
    }
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!validateEmail(form.email)) {
      errs.email = 'Enter a valid email address.';
    }
    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required.';
    }
    if (!form.address.trim()) {
      errs.address = 'Address is required.';
    }
    if (!form.username.trim()) {
      errs.username = 'Username is required.';
    } else if (
      isUsernameTakenBySystemUser(form.username) ||
      isUsernameTakenByManufacturer(form.username)
    ) {
      errs.username = 'This username is already taken. Please choose another.';
    }
    if (!form.password.trim()) {
      errs.password = 'Password is required.';
    } else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (!form.confirmPassword.trim()) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    registerCustomer({
      name: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      username: form.username.trim(),
      password: form.password,
    });

    setRegisteredName(form.fullName.trim());
    setSubmitted(true);
  };

  // ── Success screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-slate-200 text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center border-2 border-emerald-300">
            <CheckCircle className="w-7 h-7" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Registration Successful</h2>
          <p className="text-xs text-slate-500 mt-1">{registeredName}</p>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Registration successful. You can now login with your username and password.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </button>
      </div>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 border border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">
              Create Customer Account
            </h2>
            <p className="text-[11px] text-slate-500">Register to access product compliance verification</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField
          label="Full Name *"
          value={form.fullName}
          onChange={handleChange('fullName')}
          error={errors.fullName}
          placeholder="e.g. Rahul Kumar Sharma"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Email *"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            error={errors.email}
            placeholder="rahul@example.com"
          />
          <FormField
            label="Phone Number *"
            type="tel"
            value={form.phone}
            onChange={handleChange('phone')}
            error={errors.phone}
            placeholder="+91 98765 43210"
          />
        </div>

        <FormField
          label="Address *"
          multiline
          value={form.address}
          onChange={handleChange('address')}
          error={errors.address}
          placeholder="e.g. Flat 12 Main Road Hyderabad Telangana"
        />

        <div className="border-t border-slate-100 pt-3 mt-3">
          <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Login Credentials</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              label="Username *"
              value={form.username}
              onChange={handleChange('username')}
              error={errors.username}
              placeholder="Choose username"
              autoComplete="username"
            />
            <FormField
              label="Password *"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              error={errors.password}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
            />
            <FormField
              label="Confirm Password *"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={errors.confirmPassword}
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer mt-2"
        >
          Create Account
        </button>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Already have an account? Back to Login
          </button>
        </div>
      </form>
    </div>
  );
};
