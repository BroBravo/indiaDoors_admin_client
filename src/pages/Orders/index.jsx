import { useMemo } from "react";
import PaginatedTable from "../../components/PaginatedTable";
import axios from "axios";
import styles from "./index.module.css"; // ✅ CSS module import

function Orders() {
  const columns = useMemo(
    () => [
      { key: "id", header: "ID" },
      { key: "user_id", header: "User ID" },
      {
        key: "total_amount",
        header: "Amount",
        render: (v) => (v != null ? Number(v).toFixed(2) : ""),
      },
      { key: "currency", header: "CCY" },
      { key: "order_status", header: "Order Status" },
      { key: "payment_status", header: "Payment Status" },
      { key: "payment_method", header: "Method" },
      { key: "shipping_address_id", header: "Ship Addr ID" },
      { key: "billing_address_id", header: "Bill Addr ID" },
      { key: "tracking_id", header: "Tracking" },
      {
        key: "expected_delivery",
        header: "Expected",
        render: (v) => (v ? new Date(v).toLocaleDateString() : ""),
      },
      {
        key: "order_date",
        header: "Order Date",
        render: (v) => (v ? new Date(v).toLocaleString() : ""),
      },
      {
        key: "updated_at",
        header: "Updated",
        render: (v) => (v ? new Date(v).toLocaleString() : ""),
      },
    ],
    []
  );

  const fetchOrders = async ({ offset, limit }) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const { data } = await axios.get(`${baseURL}/admin/order/get/table`, {
      params: { offset, limit },
      withCredentials: true, // keep admin cookie/session
    });
    return { items: data.items || [], hasMore: !!data.hasMore };
  };

  

  return (
    <div className={styles.homeContainer}>
      {/* <header className={styles.homeHeader}>
        <h1 className={styles.headerTitle}>Welcome to Admin Dashboard</h1>
        <button onClick={logout} className={styles.logoutButton}>
          Logout
        </button>
      </header> */}

      <main className={styles.homeMain}>
        <h2 className={styles.subHeading}>Orders</h2>
        <PaginatedTable
          columns={columns}
          fetchPage={fetchOrders}
          pageSize={10}
          initialOffset={0}
        />
      </main>
    </div>
  );
}

export default Orders;
