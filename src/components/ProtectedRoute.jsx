import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Redirect to login page if not authenticated
    return <Navigate to="/auth" replace />;
  }

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com';
  const isAdmin = currentUser.email === adminEmail;

  if (adminOnly && !isAdmin) {
    // Redirect normal users away from admin dashboard to customer dashboard
    return <Navigate to="/customer/dashboard" replace />;
  }

  if (!adminOnly && isAdmin) {
    // Redirect admin away from customer dashboard to admin dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
