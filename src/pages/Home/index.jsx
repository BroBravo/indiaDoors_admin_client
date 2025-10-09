import { useMemo } from "react";
import { useUser } from "../../context/userContext";
import PaginatedTable from "../../components/PaginatedTable";
import axios from "axios";
import "./index.css";

function HomePage() {
    const columns = useMemo(
    () => [
      { key: "id", header: "ID" },
      { key: "user_id", header: "User ID" },
      { key: "total_amount", header: "Amount", render: (v) => (v != null ? Number(v).toFixed(2) : "") },
      { key: "currency", header: "CCY" },
      { key: "order_status", header: "Order Status" },
      { key: "payment_status", header: "Payment Status" },
      { key: "payment_method", header: "Method" },
      { key: "shipping_address_id", header: "Ship Addr ID" },
      { key: "billing_address_id", header: "Bill Addr ID" },
      { key: "tracking_id", header: "Tracking" },
      { key: "expected_delivery", header: "Expected", render: (v) => (v ? new Date(v).toLocaleDateString() : "") },
      { key: "order_date", header: "Order Date", render: (v) => (v ? new Date(v).toLocaleString() : "") },
      { key: "updated_at", header: "Updated", render: (v) => (v ? new Date(v).toLocaleString() : "") },
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

  const { logout } = useUser();
  

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Welcome to Admin Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </header>
      <main className="home-main">
        <h2>Orders</h2>
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

export default HomePage;
