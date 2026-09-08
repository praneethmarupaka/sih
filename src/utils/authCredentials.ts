import type { AuthRole, AuthUser } from '../context/AuthContext';

/**
 * DEV-ONLY hardcoded credentials.
 * Structured to be easily swapped for an API call to a backend authentication service later.
 */
export interface DemoAccount {
  username: string;
  passwordHashOrPlain: string;
  user: AuthUser;
}

export const DEMO_CREDENTIALS: Record<AuthRole, DemoAccount> = {
  Customer: {
    username: 'customer',
    passwordHashOrPlain: 'customer123',
    user: {
      name: 'Priya Sharma (Retail Consumer)',
      username: 'customer',
      role: 'Customer',
    },
  },
  Inspector: {
    username: 'inspector',
    passwordHashOrPlain: 'inspector123',
    user: {
      name: 'Rajesh Verma (Legal Metrology Officer)',
      username: 'inspector',
      role: 'Inspector',
    },
  },
  Admin: {
    username: 'admin',
    passwordHashOrPlain: 'admin123',
    user: {
      name: 'Director General (LMPC Admin)',
      username: 'admin',
      role: 'Admin',
    },
  },
};

export function authenticateDemoUser(
  selectedRole: AuthRole,
  usernameInput: string,
  passwordInput: string
): { success: boolean; user?: AuthUser; error?: string } {
  const trimmedUser = usernameInput.trim().toLowerCase();
  const trimmedPass = passwordInput.trim();

  const account = DEMO_CREDENTIALS[selectedRole];
  if (!account) {
    return { success: false, error: 'Invalid role selected.' };
  }

  if (trimmedUser !== account.username) {
    return {
      success: false,
      error: `Invalid username for ${selectedRole}. Expected "${account.username}".`,
    };
  }

  if (trimmedPass !== account.passwordHashOrPlain) {
    return {
      success: false,
      error: `Incorrect password for ${selectedRole}.`,
    };
  }

  return { success: true, user: account.user };
}
