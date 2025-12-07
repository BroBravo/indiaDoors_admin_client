import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "../../context/userContext";
import styles from "./index.module.css"; // ✅ CSS Module import

function LoginPage() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  try {
    const res = await axios.post(
      `${baseURL}/admin/user/login`,
      {
        loginId: form.username, // backend expects username OR phone
        password: form.password,
      },
      {
        withCredentials: true, // ✅ cookie
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (res.data.success) {
      setUser({ username: form.username, role: res.data.role });
      navigate("/"); // redirect to dashboard/home
    } else {
      setError(res.data.message || "Login failed");
    }
  } catch (err) {
    console.error("Login error:", err);
    setError(
      err.response?.data?.message ||
        "Something went wrong. Please try again."
    );
  }
};


  return (
    <>
      {!user && (
        <div className={styles.loginContainer}>
          <form className={styles.loginBox} onSubmit={handleSubmit}>
            <h2 className={styles.title}>Admin Login</h2>

            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              className={styles.input}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className={styles.input}
            />

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.button}>
              Login
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default LoginPage;

