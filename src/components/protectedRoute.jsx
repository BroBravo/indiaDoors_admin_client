import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const baseURL= import.meta.env.VITE_API_BASE_URL;
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(`${baseURL}/admin/user/auth`, { withCredentials: true });
        setAuthenticated(true);
      } catch (err) {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;

  return authenticated ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
