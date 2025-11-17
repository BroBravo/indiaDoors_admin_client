import { useMemo } from "react";
//import { useUser } from "../../context/userContext";
import PaginatedTable from "../../components/PaginatedTable";
import axios from "axios";
import styles from "./index.module.css"; // ✅ CSS module import

function Products() {
  const productColumns = useMemo(
    () => [
      { key: "product_id", header: "Product ID" },
      { key: "name", header: "Name" },
      // {
      //   key: "image",
      //   header: "Image",
      //   render: (v) =>
      //     v ? (
      //       <img
      //         src={v}
      //         alt="Product"
      //         style={{ width: "60px", height: "80px", objectFit: "cover", borderRadius: "6px" }}
      //       />
      //     ) : (
      //       ""
      //     ),
      // },
      { key: "mrp", header: "MRP", render: (v) => (v != null ? Number(v).toFixed(2) : "") },
      { key: "price", header: "Price", render: (v) => (v != null ? Number(v).toFixed(2) : "") },
      { key: "front_wrap", header: "Front Wrap" },
      { key: "back_wrap", header: "Back Wrap" },
      { key: "front_carving", header: "Front Carving" },
      { key: "back_carving", header: "Back Carving" },
      {
        key: "width_in",
        header: "Width (in)",
        render: (v) => (v != null ? Number(v).toFixed(2) : ""),
      },
      {
        key: "height_in",
        header: "Height (in)",
        render: (v) => (v != null ? Number(v).toFixed(2) : ""),
      },
      {
        key: "created_at",
        header: "Created At",
        render: (v) => (v ? new Date(v).toLocaleString() : ""),
      },
      {
        key: "updated_at",
        header: "Updated At",
        render: (v) => (v ? new Date(v).toLocaleString() : ""),
      },
    ],
    []
  );

  
 //test comment
  const laminateColumns = useMemo(
    () => [
      { key: "id", header: "Laminate ID" },
      { key: "name", header: "Name" },
      {
        key: "image_path",
        header: "Image",
        render: (v) =>
          v ? (
            <img
              src={v}
              alt="Laminate"
              style={{
                width: "60px",
                height: "60px",
                objectFit: "cover",
                borderRadius: "6px",
              }}
            />
          ) : (
            ""
          ),
      },
      {
        key: "price",
        header: "Price",
        render: (v) => (v != null ? Number(v).toFixed(2) : ""),
      },
      {
        key: "discount_perc",
        header: "Discount (%)",
        render: (v) => (v != null ? `${Number(v).toFixed(2)}%` : "0.00%"),
      },
      {
        key: "active",
        header: "Active",
        render: (v) => (v ? "✅" : "❌"),
      },
    ],
    []
  );

   const fetchProducts = async ({ offset, limit }) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const { data } = await axios.get(`${baseURL}/admin/product/get/table`, {
      params: { offset, limit },
      withCredentials: true,
    });
    return { items: data.items || [], hasMore: !!data.hasMore };
  };

const fetchFilteredProducts = async (filters = {}) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { offset = 0, limit = 10, ...otherFilters } = filters;
  const { data } = await axios.get(`${baseURL}/admin/product/get/filter`, {
    params: { ...otherFilters, offset, limit },
    withCredentials: true,
  });
  return { items: data.items || [], hasMore: !!data.hasMore };
};

  

  const fetchLaminates = async ({ offset, limit }) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const { data } = await axios.get(`${baseURL}/admin/product/laminate/get/table`, {
      params: { offset, limit },
      withCredentials: true,
    });
    return { items: data.items || [], hasMore: !!data.hasMore };
  };

  const fetchFilteredLaminates = async (filters = {}) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { offset = 0, limit = 10, ...otherFilters } = filters;
  const { data } = await axios.get(`${baseURL}/admin/product/laminate/get/filter`, {
    params: { ...otherFilters, offset, limit },
    withCredentials: true,
  });
  return { items: data.items || [], hasMore: !!data.hasMore };
};


   const fetchCarvings = async ({ offset, limit }) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const { data } = await axios.get(`${baseURL}/admin/product/carving/get/table`, {
      params: { offset, limit },
      withCredentials: true,
    });
    return { items: data.items || [], hasMore: !!data.hasMore };
  };

  const fetchFilteredCarvings = async (filters = {}) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { offset = 0, limit = 10, ...otherFilters } = filters;
  const { data } = await axios.get(`${baseURL}/admin/product/carving/get/filter`, {
    params: { ...otherFilters, offset, limit },
    withCredentials: true,
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
        <h2 className={styles.subHeading}>Finished Products list</h2>
        <PaginatedTable
          columns={productColumns}
          fetchPage={fetchProducts}
          fetchFilteredPage={fetchFilteredProducts}
          pageSize={10}
          initialOffset={0}
        />

        <h2 className={styles.subHeading}>Laminates list</h2>
        <PaginatedTable
          columns={laminateColumns}
          fetchPage={fetchLaminates}
          fetchFilteredPage={fetchFilteredLaminates}
          pageSize={10}
          initialOffset={0}
        />

        <h2 className={styles.subHeading}>Carvings list</h2>
        <PaginatedTable
          columns={laminateColumns}
          fetchPage={fetchCarvings}
          fetchFilteredPage={fetchFilteredCarvings}
          pageSize={10}
          initialOffset={0}
        />
      </main>
    </div>
  );
}

export default Products;