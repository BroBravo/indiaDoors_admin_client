import { Routes, Route, useLocation } from "react-router-dom";
import LoginPage from "./pages/Login";
import Orders from "./pages/Orders";
import Users from "./pages/Users";
import ProtectedRoute from "./components/protectedRoute.jsx";
import Navbar from './components/Navbar';
import Products from "./pages/Products";
// ✅ helper: check token
const isAuthenticated = () => {
  const token = localStorage.getItem("authToken");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // decode JWT
    const expiry = payload.exp * 1000;
    return Date.now() < expiry;
  } catch {
    return false;
  }
};

function App() {
   const location = useLocation();
  const hideNavbar = location.pathname === "/login";
  return (
    <div className="App" >
     {!hideNavbar && <Navbar/>}
      <div className="AppContent">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={<ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>}
          />
          <Route
            path="/users"
            element={<ProtectedRoute>
                      <Users />
                    </ProtectedRoute>}
          />
           <Route
            path="/products"
            element={<ProtectedRoute>
                      <Products />
                    </ProtectedRoute>}
          />
        </Routes>
      </div>  
    </div>
  );
}

export default App;
