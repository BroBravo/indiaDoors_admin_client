import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/userContext";
import "./index.css";

function HomePage() {
  const navigate = useNavigate();
  const { logout } = useUser();
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Welcome to Admin Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </header>
      <main className="home-main">
        <p>This is your admin home page content.</p>
      </main>
    </div>
  );
}

export default HomePage;
