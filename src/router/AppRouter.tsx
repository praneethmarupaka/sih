import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { CustomerDashboardPage } from '../pages/CustomerDashboardPage';
import { InspectorDashboardPage } from '../pages/InspectorDashboardPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

/** Maps an AuthRole to its canonical dashboard path. */
function roleDashboard(role: string | null): string {
  if (role === 'Customer') return '/customer/dashboard';
  if (role === 'Inspector') return '/inspector/dashboard';
  if (role === 'Admin') return '/admin/dashboard';
  return '/login';
}

/** Root redirect: authenticated users go to their dashboard, others to /login */
const RootRedirect: React.FC = () => {
  const { isAuthenticated, currentRole } = useAuth();
  return <Navigate to={isAuthenticated ? roleDashboard(currentRole) : '/login'} replace />;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Customer */}
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute allowedRole="Customer">
            <CustomerDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Inspector */}
      <Route
        path="/inspector/dashboard"
        element={
          <ProtectedRoute allowedRole="Inspector">
            <InspectorDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRole="Admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Root and any other path — smart redirect */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};
