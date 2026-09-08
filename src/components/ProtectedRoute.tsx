import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type AuthRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRole: AuthRole;
  children: React.ReactNode;
}

function roleToDashboard(role: AuthRole): string {
  switch (role) {
    case 'Customer': return '/customer/dashboard';
    case 'Inspector': return '/inspector/dashboard';
    case 'Admin': return '/admin/dashboard';
    case 'Manufacturer': return '/manufacturer/dashboard';
  }
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole, children }) => {
  const { isAuthenticated, currentRole, setUnauthorizedMessage } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !currentRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentRole !== allowedRole) {
    setUnauthorizedMessage(
      `Access Denied: You are signed in as ${currentRole}. ${allowedRole} access is restricted.`
    );
    return <Navigate to={roleToDashboard(currentRole)} replace />;
  }

  return <>{children}</>;
};
