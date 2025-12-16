import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "../../context/userContext";       
import styles from "./index.module.css"; // ✅ CSS Module import

// Convert PEM public key -> ArrayBuffer (SPKI)
function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) {
    view[i] = raw.charCodeAt(i);
  }
  return buffer;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function encryptWithPublicKey(pemPublicKey, plaintext) {
  const keyData = pemToArrayBuffer(pemPublicKey);

  const key = await window.crypto.subtle.importKey(
    "spki",
    keyData,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  const encoder = new TextEncoder();
  const encoded = encoder.encode(plaintext);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    encoded
  );

  return arrayBufferToBase64(ciphertext);
}



function LoginPage() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
   const [publicKey, setPublicKey] = useState("");    
  const [loadingKey, setLoadingKey] = useState(true);
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

    // 🆕 Fetch RSA public key on mount
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const res = await axios.get(`${baseURL}/admin/user/public-key`, {
          withCredentials: true,
        });
        setPublicKey(res.data.publicKey);
      } catch (err) {
        console.error("Failed to fetch public key", err);
        setError("Cannot load security keys. Please try again later.");
      } finally {
        setLoadingKey(false);
      }
    };

    fetchKey();
  }, [baseURL]);


 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  if (loadingKey) {
    setError("Loading security keys, please wait...");
    return;
  }

  if (!publicKey) {
    setError("Encryption key not available. Contact admin.");
    return;
  }

  try {
    const payload = JSON.stringify({
      loginId: form.username, // username or phone
      password: form.password,
    });

    // 🔐 Encrypt with RSA-OAEP using WebCrypto
    const encrypted = await encryptWithPublicKey(publicKey, payload);

    // Send only encrypted blob
    const res = await axios.post(
      `${baseURL}/admin/user/login`,
      { encrypted },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (res.data.success) {
      setUser({ username: form.username, role: res.data.role });
      navigate("/");
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

