import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PaginatedTable from "../../components/PaginatedTable";
import { useUser } from "../../context/userContext";
import styles from "./index.module.css";

function UsersPage() {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { user, loading } = useUser();
  const navigate = useNavigate();

  // 🔐 Route guard – only admin can access this page
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "admin") {
        navigate("/"); // or show a 403 page if you want
      }
    }
  }, [loading, user, navigate]);

  // ===================== Columns for both tables =====================
  const userColumns = useMemo(
    () => [
      { key: "id", header: "ID" },
      {
        key: "username",
        header: "Username",
        editType: "text",
      },
      {
        key: "phone",
        header: "Phone",
        editType: "text",
      },
      {
        key: "email",
        header: "Email",
        editType: "text",
      },
      {
        key: "password",
        header: "Password",
        // we never show real password, just a placeholder
        render: () => "••••••",
        editType: "text", // "set new password" field in modal
      },
      {
        key: "is_active",
        header: "Active",
        render: (v) => (v ? "✅" : "❌"),
        editType: "checkbox",
      },
    ],
    []
  );

  // ===================== Fetch helpers =====================

  const fetchAdminUsers = async ({ offset, limit, role }) => {
    const { data } = await axios.get(`${baseURL}/admin/user/list`, {
      params: { role, offset, limit },
      withCredentials: true,
    });

    return {
      items: data.items || [],
      hasMore: !!data.hasMore,
    };
  };

  const fetchSuperusersPage = ({ offset, limit }) =>
    fetchAdminUsers({ offset, limit, role: "superuser" });

  const fetchUsersPage = ({ offset, limit }) =>
    fetchAdminUsers({ offset, limit, role: "user" });

  // Single/bulk update (PaginatedTable will use this for single-row edit)
  const updateAdminUsers = async ({ ids, filters, updateData }) => {
    // updateData can include: username, phone, email, is_active, password (new)
    const { data } = await axios.post(
      `${baseURL}/admin/user/bulk-update`,
      {
        ids,
        filters, // you can ignore filters server-side if you want
        data: updateData,
      },
      { withCredentials: true }
    );
    return data;
  };

  // ===================== Add new user / superuser form =====================

  const [formValues, setFormValues] = useState({
    username: "",
    password: "",
    phone: "",
    email: "",
    role: "user", // "user" or "superuser"
    is_active: true,
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const { username, password, role, phone, email, is_active } = formValues;

    if (!username || !password || !role) {
      setFormError("Username, password and role are required.");
      return;
    }

    try {
      setFormLoading(true);

      // This assumes you've extended /signup to accept phone, email, is_active.
      await axios.post(
        `${baseURL}/admin/user/signup`,
        {
          username,
          password,
          usertype: role, // backend expects `usertype`
          phone,
          email,
          is_active: is_active ? 1 : 0,
        },
        { withCredentials: true }
      );

      setFormSuccess("User created successfully.");
      setFormValues({
        username: "",
        password: "",
        phone: "",
        email: "",
        role: "user",
        is_active: true,
      });

      // Optionally trigger a table reload if you wire a "reload" state to PaginatedTable
    } catch (err) {
      console.error("Create admin user failed:", err);
      setFormError(
        err.response?.data?.message || "Failed to create user. Check console."
      );
    } finally {
      setFormLoading(false);
    }
  };

  if (loading || !user || user.role !== "admin") {
    // simple loading/guard; route redirect is already handled above
    return null;
  }

  return (
    <div className={styles.userPage}>
      <h1 className={styles.pageTitle}>
        <span>Admin – Manage Users</span>
      </h1>

      {/* ===== Add user/superuser form ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Create User / Superuser</h2>
        <form className={styles.form} onSubmit={handleCreateUser}>
          <div className={styles.formRow}>
            <label className={styles.label}>
              Username
              <input
                type="text"
                name="username"
                value={formValues.username}
                onChange={handleFormChange}
                className={styles.input}
                required
              />
            </label>
            <label className={styles.label}>
              Password
              <input
                type="password"
                name="password"
                value={formValues.password}
                onChange={handleFormChange}
                className={styles.input}
                required
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>
              Phone
              <input
                type="text"
                name="phone"
                value={formValues.phone}
                onChange={handleFormChange}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              Email
              <input
                type="email"
                name="email"
                value={formValues.email}
                onChange={handleFormChange}
                className={styles.input}
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>
              Role
              <select
                name="role"
                value={formValues.role}
                onChange={handleFormChange}
                className={styles.select}
              >
                <option value="user">User</option>
                <option value="superuser">Superuser</option>
                {/* ❌ no "admin" here; only one admin allowed */}
              </select>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="is_active"
                checked={formValues.is_active}
                onChange={handleFormChange}
              />
              Active
            </label>
          </div>

          {formError && <div className={styles.error}>{formError}</div>}
          {formSuccess && (
            <div className={styles.success}>{formSuccess}</div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={formLoading}
          >
            {formLoading ? "Creating..." : "Create"}
          </button>
        </form>
      </section>

      {/* ===== Superusers table – full viewport width ===== */}
      <section className={`${styles.section} ${styles.fullWidthSection}`}>
        <h2 className={styles.sectionTitle}>Superusers</h2>
        <PaginatedTable
          columns={userColumns}
          fetchPage={fetchSuperusersPage}
          pageSize={10}
          initialOffset={0}
          onUpdateRows={updateAdminUsers}
          onCreateRow={null}
          enableBulkEdit={false} // 🔒 only single-row edit
        />
      </section>

      {/* ===== Users table – full viewport width ===== */}
      <section className={`${styles.section} ${styles.fullWidthSection}`}>
        <h2 className={styles.sectionTitle}>Users</h2>
        <PaginatedTable
          columns={userColumns}
          fetchPage={fetchUsersPage}
          pageSize={10}
          initialOffset={0}
          onUpdateRows={updateAdminUsers}
          onCreateRow={null}
          enableBulkEdit={false} // 🔒 only single-row edit
        />
      </section>
    </div>
  );
}

export default UsersPage;
