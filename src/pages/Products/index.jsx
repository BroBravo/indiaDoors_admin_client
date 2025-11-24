import { useMemo, useState } from "react";
//import { useUser } from "../../context/userContext";
import PaginatedTable from "../../components/PaginatedTable";
import axios from "axios";
import styles from "./index.module.css"; // ✅ CSS module import

function WrapPreview({ src, label }) {
  const [open, setOpen] = useState(false);

  if (!src) {
    return <span>{label || "-"}</span>;
  }

  const handleOpen = (e) => {
    e.stopPropagation();
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  return (
    <>
      <div className={styles.wrapCell}>
        <div className={styles.wrapThumbWrapper} onClick={handleOpen}>
          <img src={src} alt={label || "Wrap"} className={styles.wrapThumb} />
          {/* Hover popup for desktop */}
          <div className={styles.wrapHoverCard}>
            <img src={src} alt={label || "Wrap preview"} className={styles.wrapHoverImg} />
          </div>
        </div>
        <span>{label || "-"}</span>
      </div>

      {/* Fullscreen overlay (for mobile + desktop click) */}
      {open && (
        <div className={styles.wrapOverlay} onClick={handleClose}>
          <div
            className={styles.wrapOverlayInner}
            onClick={(e) => e.stopPropagation()} // don't close when tapping image
          >
            <img src={src} alt={label || "Wrap large"} className={styles.wrapOverlayImg} />
          </div>
        </div>
      )}
    </>
  );
}


function Products() {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
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
     
      {
        key: "front_wrap",
        header: "Front Wrap",
        render: (value, row) => (
          <WrapPreview
            src={row.front_wrap_image ? `${baseURL}/${row.front_wrap_image}` : null}
            label={value}
          />
        ),
      },
      {
        key: "back_wrap",
        header: "Back Wrap",
        render: (value, row) => (
          <WrapPreview
            src={row.back_wrap_image ? `${baseURL}/${row.back_wrap_image}` : null}
            label={value}
          />
        ),
      },

      {
        key: "front_carving",
        header: "Front Carving",
        render: (value, row) => (
          <WrapPreview
            src={
              row.front_carving_image
                ? `${baseURL}/${row.front_carving_image}`
                : null
            }
            label={value}
          />
        ),
      },

      // 🪵 BACK CARVING – same behavior
      {
        key: "back_carving",
        header: "Back Carving",
        render: (value, row) => (
          <WrapPreview
            src={
              row.back_carving_image
                ? `${baseURL}/${row.back_carving_image}`
                : null
            }
            label={value}
          />
        ),
      },

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

  

 const laminateColumns = useMemo(
  () => [
    { key: "id", header: "Laminate ID" },
    { key: "name", header: "Name" },
    {
      key: "image_path",
      header: "Image",
      render: (v, row) => (
        <WrapPreview
          src={v ? `${baseURL}/${v}` : null}

        />
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
      filterType: "select",  
      filterOptions: [
        { value: "", label: "All" },   // default (no filter)
        { value: "1", label: "Active" },
        { value: "0", label: "Inactive" },
      ],
    },
  ],
  [baseURL]
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

const updateProducts = async ({ ids, filters, updateData }) => {
  // ids: string[] | number[] | null
  // filters: { [columnName]: string }
  // updateData: { [columnName]: any }
 const baseURL = import.meta.env.VITE_API_BASE_URL;
  try {
    const { data } = await axios.post(
      `${baseURL}/admin/product/bulk-update`,
      {
        ids,       // null | [product_id, ...]
        filters,   // { name: "...", price: "..." } etc.
        data: updateData, // fields to update
      },
      { withCredentials: true }
    );

    // Optionally, you can return data if you want to use it later
    return data;
  } catch (err) {
    console.error("updateProducts failed:", err);
    // Re-throw so PaginatedTable can show "Failed to apply updates."
    throw err;
  }
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
          onUpdateRows={updateProducts}
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