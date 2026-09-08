/**
 * Centralized authentication utilities.
 *
 * LocalStorage keys:
 *   auth_session   — currently logged-in session (managed by AuthContext)
 *   users          — Customer, Inspector, Admin accounts
 *   manufacturers  — Manufacturer registrations + approval records
 *
 * Structured so these helpers can later be replaced with API calls
 * without changing callers.
 */

import type { AuthRole, AuthUser } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────────────────────────────────────
const USERS_KEY = 'users';
const MANUFACTURERS_KEY = 'manufacturers';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface SystemUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  username: string;
  password: string; // plain text for MVP; swap with hashed comparison for production
  role: 'Customer' | 'Inspector' | 'Admin';
  status?: 'Active';
  createdAt?: string;
}

export type ManufacturerStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ManufacturerRecord {
  id: string;
  companyName: string;
  contactPersonName: string;
  email: string;
  phone: string;
  businessAddress: string;
  licenseNumber: string;
  username: string;
  password: string; // plain text for MVP
  role: 'Manufacturer';
  status: ManufacturerStatus;
  submittedAt: string; // ISO timestamp
}

export type InspectorStatus = 'Pending' | 'Approved' | 'Rejected';

export interface InspectorRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  inspectorId: string;   // Inspector ID / Employee ID
  department: string;    // Department / Organization
  username: string;
  password: string; // plain text for MVP
  role: 'Inspector';
  status: InspectorStatus;
  submittedAt: string; // ISO timestamp
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data — Admin system account only.
// Inspector accounts must now be registered via the Inspector Registration form
// and approved by an Admin. Customer accounts must also be registered.
// Credentials are NOT shown in the UI.
// ─────────────────────────────────────────────────────────────────────────────
const SEED_USERS: SystemUser[] = [
  {
    id: 'user-admin-001',
    name: 'Director General',
    username: 'admin',
    password: 'admin123',
    role: 'Admin',
    status: 'Active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: generate a simple unique ID
// ─────────────────────────────────────────────────────────────────────────────
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const INSPECTORS_KEY = 'inspectors';

// ─────────────────────────────────────────────────────────────────────────────
// System Users (Customer / Admin)
// Note: Inspector accounts are now stored separately in the inspectors store.
// ─────────────────────────────────────────────────────────────────────────────
export function getSystemUsers(): SystemUser[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as SystemUser[];
      // Filter out legacy manager, mock demo customer, and old inspector seed
      const cleaned = parsed.filter(
        (u) =>
          u.id !== 'user-manager-001' &&
          u.id !== 'user-customer-001' &&
          u.id !== 'user-inspector-001' &&
          (u.role as string) !== 'Manager' &&
          (u.role as string) !== 'Inspector'
      );
      // Ensure Admin seed account exists
      for (const seed of SEED_USERS) {
        if (
          !cleaned.some(
            (u) =>
              u.username.toLowerCase() === seed.username.toLowerCase() &&
              u.role === seed.role
          )
        ) {
          cleaned.push(seed);
        }
      }
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(USERS_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    }
  } catch {
    // ignore
  }
  // First run: seed Admin default
  localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
  return SEED_USERS;
}

export function saveSystemUsers(users: SystemUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function registerCustomer(customerData: {
  name: string;
  email: string;
  phone: string;
  address: string;
  username: string;
  password: string;
}): SystemUser {
  const users = getSystemUsers();
  const newUser: SystemUser = {
    id: generateId('cust'),
    name: customerData.name.trim(),
    email: customerData.email.trim().toLowerCase(),
    phone: customerData.phone.trim(),
    address: customerData.address.trim(),
    username: customerData.username.trim().toLowerCase(),
    password: customerData.password,
    role: 'Customer',
    status: 'Active',
    createdAt: new Date().toISOString(),
  };

  saveSystemUsers([...users, newUser]);
  return newUser;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inspectors (registration + approval flow, mirrors Manufacturer pattern)
// ─────────────────────────────────────────────────────────────────────────────
export function getInspectors(): InspectorRecord[] {
  try {
    const stored = localStorage.getItem(INSPECTORS_KEY);
    if (stored) return JSON.parse(stored) as InspectorRecord[];
  } catch {
    // ignore
  }
  return [];
}

export function saveInspectors(records: InspectorRecord[]): void {
  localStorage.setItem(INSPECTORS_KEY, JSON.stringify(records));
}

export function addInspector(record: InspectorRecord): void {
  const existing = getInspectors();
  saveInspectors([...existing, record]);
}

export function updateInspectorStatus(id: string, status: InspectorStatus): void {
  const records = getInspectors();
  const updated = records.map((r) => (r.id === id ? { ...r, status } : r));
  saveInspectors(updated);
}

export function isInspectorIdTaken(inspectorId: string): boolean {
  return getInspectors().some(
    (r) => r.inspectorId.toLowerCase() === inspectorId.trim().toLowerCase()
  );
}

export function isUsernameTakenByInspector(username: string): boolean {
  return getInspectors().some(
    (r) => r.username.toLowerCase() === username.trim().toLowerCase()
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Manufacturers
// ─────────────────────────────────────────────────────────────────────────────
export function getManufacturers(): ManufacturerRecord[] {
  try {
    const stored = localStorage.getItem(MANUFACTURERS_KEY);
    if (stored) return JSON.parse(stored) as ManufacturerRecord[];
  } catch {
    // ignore
  }
  return [];
}

export function saveManufacturers(records: ManufacturerRecord[]): void {
  localStorage.setItem(MANUFACTURERS_KEY, JSON.stringify(records));
}

export function addManufacturer(record: ManufacturerRecord): void {
  const existing = getManufacturers();
  saveManufacturers([...existing, record]);
}

export function updateManufacturerStatus(id: string, status: ManufacturerStatus): void {
  const records = getManufacturers();
  const updated = records.map((r) => (r.id === id ? { ...r, status } : r));
  saveManufacturers(updated);
}

export function isUsernameTakenByManufacturer(username: string): boolean {
  return getManufacturers().some(
    (r) => r.username.toLowerCase() === username.trim().toLowerCase()
  );
}

export function isUsernameTakenBySystemUser(username: string): boolean {
  const clean = username.trim().toLowerCase();
  // Only 'admin' is a fixed system username now; Inspector comes from inspectors store
  if (clean === 'admin') return true;
  return getSystemUsers().some(
    (u) => u.username.toLowerCase() === clean
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────────────────────────────────────

export type AuthResult =
  | { success: true; user: AuthUser }
  | { success: false; error: string }
  | {
      success: 'manufacturer_pending' | 'manufacturer_rejected';
      manufacturer: ManufacturerRecord;
    }
  | {
      success: 'inspector_pending' | 'inspector_rejected';
      inspector: InspectorRecord;
    };

export function authenticateUser(
  role: AuthRole,
  username: string,
  password: string
): AuthResult {
  const trimUser = username.trim().toLowerCase();
  const trimPass = password.trim();

  // Admin login (hardcoded dev/system account — does not depend on localStorage)
  if (role === 'Admin') {
    if (trimUser === 'admin' && trimPass === 'admin123') {
      return {
        success: true,
        user: {
          id: 'user-admin-001',
          name: 'Director General',
          username: 'admin',
          role: 'Admin',
        },
      };
    }
    return { success: false, error: 'Invalid username or password.' };
  }

  // Inspector login — uses registered Inspector records + approval status
  if (role === 'Inspector') {
    const inspectors = getInspectors();
    const inspector = inspectors.find(
      (i) => i.username.toLowerCase() === trimUser && i.password === trimPass
    );

    if (!inspector) {
      return { success: false, error: 'Account not found. Please register as an Inspector first.' };
    }

    if (inspector.status === 'Pending') {
      return { success: 'inspector_pending', inspector };
    }
    if (inspector.status === 'Rejected') {
      return { success: 'inspector_rejected', inspector };
    }
    // Approved
    return {
      success: true,
      user: {
        id: inspector.id,
        name: inspector.fullName,
        username: inspector.username,
        role: 'Inspector',
      },
    };
  }

  if (role === 'Manufacturer') {
    const mfrs = getManufacturers();
    const mfr = mfrs.find(
      (m) => m.username.toLowerCase() === trimUser && m.password === trimPass
    );

    if (!mfr) {
      return { success: false, error: 'Invalid username or password for Manufacturer.' };
    }

    if (mfr.status === 'Pending') {
      return { success: 'manufacturer_pending', manufacturer: mfr };
    }
    if (mfr.status === 'Rejected') {
      return { success: 'manufacturer_rejected', manufacturer: mfr };
    }
    // Approved
    return {
      success: true,
      user: {
        id: mfr.id,
        name: mfr.companyName,
        username: mfr.username,
        role: 'Manufacturer',
      },
    };
  }

  if (role === 'Customer') {
    const users = getSystemUsers();
    const foundUser = users.find(
      (u) => u.username.toLowerCase() === trimUser && u.role === 'Customer'
    );

    if (!foundUser) {
      return { success: false, error: 'Account not found. Please register first.' };
    }
    if (foundUser.password !== trimPass) {
      return { success: false, error: 'Invalid username or password.' };
    }

    return {
      success: true,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        username: foundUser.username,
        role: 'Customer',
      },
    };
  }

  return { success: false, error: 'Invalid username or password.' };
}

