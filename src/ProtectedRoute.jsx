import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading, isAuthenticated } = useAuth();

  // While checking auth, show loading
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check role if specified
  if (role && user?.role !== role) {
    return <Navigate to="/login" />;
  }

  // All checks passed
  return children;
}
