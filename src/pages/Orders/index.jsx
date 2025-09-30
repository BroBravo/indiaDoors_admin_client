import { useNavigate } from "react-router-dom";
import "./index.css";

function Orders() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Welcome to Admin Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <main className="home-main">
        <p>This is your Orders page content.</p>
      </main>
    </div>
  );
}

export default Orders;