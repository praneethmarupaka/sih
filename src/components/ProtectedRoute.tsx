import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type AuthRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRole: AuthRole;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole, children }) => {
  const { isAuthenticated, currentRole, setUnauthorizedMessage } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !currentRole) {
    // Unauthenticated user -> redirect to /login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentRole !== allowedRole) {
    // Logged in as a different role -> redirect to their own dashboard with an unauthorized notice
    const targetDashboard =
      currentRole === 'Customer'
        ? '/customer/dashboard'
        : currentRole === 'Inspector'
        ? '/inspector/dashboard'
        : '/admin/dashboard';

    setUnauthorizedMessage(
      `Access Denied: You are signed in as ${currentRole}. Access to ${allowedRole} dashboard is restricted.`
    );

    return <Navigate to={targetDashboard} replace />;
  }

  return <>{children}</>;
};
