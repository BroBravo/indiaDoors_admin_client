import { Navigate } from "react-router-dom";
import { useUser } from "../context/userContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useUser();

  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;

