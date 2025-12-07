import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./index.module.css";
import { useUser } from "../../context/userContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false); // mobile nav
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // username/logout box

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const { user, logout } = useUser();

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    setIsOpen(false);
    logout();
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link to="/" className={styles.logo}>
          IndiaDoors
        </Link>

        {/* Hamburger for mobile */}
        <button
          className={`${styles.hamburger} ${isOpen ? styles.active : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>

        {/* Center / left menu */}
        <div className={`${styles.navMenu} ${isOpen ? styles.show : ""}`}>
          <Link to="/" onClick={closeMenu} className={styles.navLink}>
            Orders
          </Link>

          {/* 🔐 Only visible for admin */}
          {user?.role === "admin" && (
            <Link to="/users" onClick={closeMenu} className={styles.navLink}>
              Users
            </Link>
          )}

          <Link to="/products" onClick={closeMenu} className={styles.navLink}>
            Products
          </Link>
        </div>

        {/* Right side: role badge + CLICK-TOGGLE dropdown */}
        {user && (
          <div className={styles.userArea}>
            {/* Role pill on the right */}
            <button
              type="button"
              className={styles.roleBadge}
              onClick={() => setIsUserMenuOpen((prev) => !prev)} // ✅ pure toggle
            >
              {user.role}
            </button>

            {isUserMenuOpen && (
              <div className={styles.userDropdown}>
                <div className={styles.userInfo}>
                  <span className={styles.userLabel}>Logged in as</span>
                  <span className={styles.userName}>{user.username}</span>
                  <span className={styles.userRole}>({user.role})</span>
                </div>
                <button
                  type="button"
                  className={styles.logoutButton}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
