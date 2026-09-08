import React, { createContext, useContext, useState, useEffect } from 'react';

export type AuthRole = 'Customer' | 'Inspector' | 'Admin';

export interface AuthUser {
  name: string;
  username: string;
  role: AuthRole;
}

interface AuthContextType {
  currentUser: string | null;
  currentRole: AuthRole | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  unauthorizedMessage: string | null;
  clearUnauthorizedMessage: () => void;
  setUnauthorizedMessage: (msg: string | null) => void;
}

const AUTH_STORAGE_KEY = 'lm_compliance_auth_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored auth session:', e);
    }
    return null;
  });

  const [unauthorizedMessage, setUnauthorizedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } catch (e) {
        console.warn('Failed to persist auth session:', e);
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = (newUser: AuthUser) => {
    setUser(newUser);
    setUnauthorizedMessage(null);
  };

  const logout = () => {
    setUser(null);
    setUnauthorizedMessage(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear stored auth session:', e);
    }
  };

  const clearUnauthorizedMessage = () => {
    setUnauthorizedMessage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser: user ? user.name : null,
        currentRole: user ? user.role : null,
        user,
        isAuthenticated: !!user,
        login,
        logout,
        unauthorizedMessage,
        clearUnauthorizedMessage,
        setUnauthorizedMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
