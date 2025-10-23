import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./index.module.css";
import { useUser } from "../../context/userContext";
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  const { logout } = useUser();
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link to="/" className={styles.logo}>
          IndiaDoors
        </Link>

        <button
          className={`${styles.hamburger} ${isOpen ? styles.active : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>

        <div className={`${styles.navMenu} ${isOpen ? styles.show : ""}`}>
          <Link to="/" onClick={closeMenu} className={styles.navLink}>
            Orders
          </Link>
          <Link to="/users" onClick={closeMenu} className={styles.navLink}>
            Users
          </Link>
          
          <Link to="/products" onClick={closeMenu} className={styles.navLink}>
            Products
          </Link>
        </div>
        <button onClick={logout} className={styles.navLogin}>
            Logout
        </button>
      </div>
    </nav>
  );
}
