import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
import {
  addInspector,
  generateId,
  isInspectorIdTaken,
  isUsernameTakenByInspector,
  isUsernameTakenByManufacturer,
  isUsernameTakenBySystemUser,
} from '../utils/authCredentials';

interface Props {
  onBack: () => void;
}

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  inspectorId: string;
  department: string;
  username: string;
  password: string;
  confirmPassword: string;
}

const EMPTY: FormState = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  inspectorId: '',
  department: '',
  username: '',
  password: '',
  confirmPassword: '',
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─────────────────────────────────────────────────────────────────────────────
// FormField MUST be at module level — never nested inside a component.
// Defining it inside causes React to unmount/remount the input on every
// keystroke, losing focus after a single character typed.
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

export const InspectorRegistrationForm: React.FC<Props> = ({ onBack }) => {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [submittedInspectorId, setSubmittedInspectorId] = useState('');

  // Use raw e.target.value to preserve spaces and multi-word values
  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const rawValue = e.target.value;
    setForm((prev) => ({ ...prev, [field]: rawValue }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<FormState> = {};

    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!validateEmail(form.email)) {
      errs.email = 'Enter a valid email address.';
    }
    if (!form.phone.trim()) errs.phone = 'Phone number is required.';
    if (!form.address.trim()) errs.address = 'Address is required.';
    if (!form.inspectorId.trim()) {
      errs.inspectorId = 'Inspector ID / Employee ID is required.';
    } else if (isInspectorIdTaken(form.inspectorId)) {
      errs.inspectorId = 'This Inspector ID is already registered.';
    }
    if (!form.department.trim()) errs.department = 'Department / Organization is required.';
    if (!form.username.trim()) {
      errs.username = 'Username is required.';
    } else if (
      isUsernameTakenByInspector(form.username) ||
      isUsernameTakenByManufacturer(form.username) ||
      isUsernameTakenBySystemUser(form.username)
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

    addInspector({
      id: generateId('insp'),
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      inspectorId: form.inspectorId.trim(),
      department: form.department.trim(),
      username: form.username.trim().toLowerCase(),
      password: form.password,
      role: 'Inspector',
      status: 'Pending',
      submittedAt: new Date().toISOString(),
    });

    setSubmittedName(form.fullName.trim());
    setSubmittedInspectorId(form.inspectorId.trim());
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
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Registration Submitted</h2>
          <p className="text-xs text-slate-500 mt-1">{submittedName} · ID: {submittedInspectorId}</p>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your registration has been submitted and is awaiting Admin review. Your account will be reviewed and approved before you can access the Inspector dashboard.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
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
          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">
              Inspector Registration
            </h2>
            <p className="text-[11px] text-slate-500">Pending Admin approval after submission</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Full Name *"
            value={form.fullName}
            onChange={handleChange('fullName')}
            error={errors.fullName}
            placeholder="e.g. Rahul Kumar"
          />
          <FormField
            label="Email Address *"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            error={errors.email}
            placeholder="officer@department.gov.in"
          />
          <FormField
            label="Phone Number *"
            type="tel"
            value={form.phone}
            onChange={handleChange('phone')}
            error={errors.phone}
            placeholder="+91 98765 43210"
          />
          <FormField
            label="Inspector ID / Employee ID *"
            value={form.inspectorId}
            onChange={handleChange('inspectorId')}
            error={errors.inspectorId}
            placeholder="e.g. LMI/2026/TS/001"
          />
        </div>

        <FormField
          label="Department / Organization *"
          value={form.department}
          onChange={handleChange('department')}
          error={errors.department}
          placeholder="e.g. Legal Metrology Department, Government of Telangana"
        />

        <FormField
          label="Address *"
          multiline
          value={form.address}
          onChange={handleChange('address')}
          error={errors.address}
          placeholder="e.g. 12 Main Road Hyderabad Telangana"
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
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer mt-2"
        >
          Submit Registration
        </button>
      </form>
    </div>
  );
};
