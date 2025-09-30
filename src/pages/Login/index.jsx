import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔑 Here you’ll call backend API for login
    // Dummy token with 1hr expiry for now
    const fakeToken = {
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    };
    const token = `header.${btoa(JSON.stringify(fakeToken))}.sig`;

    localStorage.setItem("authToken", token);
    navigate("/");
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleSubmit}>
        <h2>Admin Login</h2>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;
