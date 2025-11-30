
// pages/Products/index.jsx
import { useMemo, useState, useEffect } from "react";
import PaginatedTable, { ImagePreviewCell } from "../../components/PaginatedTable";
import axios from "axios";
import styles from "./index.module.css";

function Products() {
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [laminateOptions, setLaminateOptions] = useState([]);
  const [carvingOptions, setCarvingOptions] = useState([]);

  // Load all laminates / carvings once for dropdowns
  useEffect(() => {
    const load = async () => {
      try {
        // laminates
        const lamRes = await axios.get(
          `${baseURL}/admin/product/laminate/get/table`,
          {
            params: { offset: 0, limit: 1000 },
            withCredentials: true,
          }
        );
        const lamItems = lamRes.data.items || [];
        setLaminateOptions(
          lamItems.map((l) => ({
            value: l.name, // or l.id if your backend expects ID
            label: l.name,
            image_path: l.image_path,
          }))
        );

        // carvings
        const carRes = await axios.get(
          `${baseURL}/admin/product/carving/get/table`,
          {
            params: { offset: 0, limit: 1000 },
            withCredentials: true,
          }
        );
        const carItems = carRes.data.items || [];
        setCarvingOptions(
          carItems.map((c) => ({
            value: c.name, // or c.id
            label: c.name,
            image_path: c.image_path,
          }))
        );
      } catch (err) {
        console.error("Failed loading laminate/carving options", err);
      }
    };
    load();
  }, [baseURL]);

  /* ---------- Finished products columns ---------- */

  const productColumns = useMemo(
    () => [
      { key: "product_id", header: "Product ID" },
      { key: "name", header: "Name" },
      {
        key: "mrp",
        header: "MRP",
        render: (v) => (v != null ? Number(v).toFixed(2) : ""),
      },
      {
        key: "price",
        header: "Price",
        render: (v) => (v != null ? Number(v).toFixed(2) : ""),
      },

      // FRONT WRAP
      {
        key: "front_wrap",
        header: "Front Wrap",
        render: (value, row) => (
          <ImagePreviewCell
            src={row.front_wrap_image ? `${baseURL}/${row.front_wrap_image}` : null}
            label={value}
          />
        ),
        editType: "select",
        editOptions: laminateOptions,
      },
      // BACK WRAP
      {
        key: "back_wrap",
        header: "Back Wrap",
        render: (value, row) => (
          <ImagePreviewCell
            src={row.back_wrap_image ? `${baseURL}/${row.back_wrap_image}` : null}
            label={value}
          />
        ),
        editType: "select",
        editOptions: laminateOptions,
      },
      // FRONT CARVING
      {
        key: "front_carving",
        header: "Front Carving",
        render: (value, row) => (
          <ImagePreviewCell
            src={
              row.front_carving_image
                ? `${baseURL}/${row.front_carving_image}`
                : null
            }
            label={value}
          />
        ),
        editType: "select",
        editOptions: carvingOptions,
      },
      // BACK CARVING
      {
        key: "back_carving",
        header: "Back Carving",
        render: (value, row) => (
          <ImagePreviewCell
            src={
              row.back_carving_image
                ? `${baseURL}/${row.back_carving_image}`
                : null
            }
            label={value}
          />
        ),
        editType: "select",
        editOptions: carvingOptions,
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
    [baseURL, laminateOptions, carvingOptions]
  );

  /* ---------- Laminate columns ---------- */

  const laminateColumns = useMemo(
    () => [
      { key: "id", header: "Laminate ID" },
      { key: "name", header: "Name" },
      {
        key: "image_path",
        header: "Image",
        render: (v, row) => (
          <ImagePreviewCell
            src={v ? `${baseURL}/${v}` : null}
            label={row.name}
          />
        ),
        editType: "file",
        getImageSrc: (row) =>
          row.image_path ? `${baseURL}/${row.image_path}` : null,
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
          { value: "", label: "All" },
          { value: "1", label: "Active" },
          { value: "0", label: "Inactive" },
        ],
        editType: "checkbox",
      },
    ],
    [baseURL]
  );

  /* ---------- Carving columns (reuse laminateColumns except header text) ---------- */

  const carvingColumns = laminateColumns.map((c) =>
    c.key === "id"
      ? { ...c, header: "Carving ID" }
      : c
  );

  /* ---------- Helper: send JSON or FormData depending on Files ---------- */

  const buildPayload = (ids, filters, updateData) => {
    const hasFile = Object.values(updateData).some((v) => v instanceof File);

    if (!hasFile) {
      return {
        data: { ids, filters, data: updateData },
        headers: {},
      };
    }

    const fd = new FormData();
    fd.append("ids", JSON.stringify(ids));
    fd.append("filters", JSON.stringify(filters));

    Object.entries(updateData).forEach(([k, v]) => {
      if (v instanceof File) {
        fd.append(k, v);
      } else if (v !== undefined && v !== null) {
        fd.append(k, v);
      }
    });

    return {
      data: fd,
      headers: { "Content-Type": "multipart/form-data" },
    };
  };

  /* ---------- API fns ---------- */

  const fetchProducts = async ({ offset, limit }) => {
    const { data } = await axios.get(
      `${baseURL}/admin/product/get/table`,
      {
        params: { offset, limit },
        withCredentials: true,
      }
    );
    return { items: data.items || [], hasMore: !!data.hasMore };
  };

  const fetchFilteredProducts = async (filters = {}) => {
    const { offset = 0, limit = 10, ...otherFilters } = filters;
    const { data } = await axios.get(
      `${baseURL}/admin/product/get/filter`,
      {
        params: { ...otherFilters, offset, limit },
        withCredentials: true,
      }
    );
    return { items: data.items || [], hasMore: !!data.hasMore };
  };

  const updateProducts = async ({ ids, filters, updateData }) => {
    try {
      const { data: payload, headers } = buildPayload(ids, filters, updateData);
      const res = await axios.post(
        `${baseURL}/admin/product/bulk-update`,
        payload,
        { withCredentials: true, headers }
      );
      return res.data;
    } catch (err) {
      console.error("updateProducts failed:", err);
      throw err;
    }
  };

  const fetchLaminates = async ({ offset, limit }) => {
    const { data } = await axios.get(
      `${baseURL}/admin/product/laminate/get/table`,
      {
        params: { offset, limit },
        withCredentials: true,
      }
    );
    return { items: data.items || [], hasMore: !!data.hasMore };
  };

  const fetchFilteredLaminates = async (filters = {}) => {
    const { offset = 0, limit = 10, ...otherFilters } = filters;
    const { data } = await axios.get(
      `${baseURL}/admin/product/laminate/get/filter`,
      {
        params: { ...otherFilters, offset, limit },
        withCredentials: true,
      }
    );
    return { items: data.items || [], hasMore: !!data.hasMore };
  };

  const updateLaminates = async ({ ids, filters, updateData }) => {
    try {
      const { data: payload, headers } = buildPayload(ids, filters, updateData);
      const res = await axios.post(
        `${baseURL}/admin/product/laminate/bulk-update`,
        payload,
        { withCredentials: true, headers }
      );
      return res.data;
    } catch (err) {
      console.error("updateLaminates failed:", err);
      throw err;
    }
  };

  const fetchCarvings = async ({ offset, limit }) => {
    const { data } = await axios.get(
      `${baseURL}/admin/product/carving/get/table`,
      {
        params: { offset, limit },
        withCredentials: true,
      }
    );
    return { items: data.items || [], hasMore: !!data.hasMore };
  };

  const fetchFilteredCarvings = async (filters = {}) => {
    const { offset = 0, limit = 10, ...otherFilters } = filters;
    const { data } = await axios.get(
      `${baseURL}/admin/product/carving/get/filter`,
      {
        params: { ...otherFilters, offset, limit },
        withCredentials: true,
      }
    );
    return { items: data.items || [], hasMore: !!data.hasMore };
  };

  const updateCarvings = async ({ ids, filters, updateData }) => {
    try {
      const { data: payload, headers } = buildPayload(ids, filters, updateData);
      const res = await axios.post(
        `${baseURL}/admin/product/carving/bulk-update`,
        payload,
        { withCredentials: true, headers }
      );
      return res.data;
    } catch (err) {
      console.error("updateCarvings failed:", err);
      throw err;
    }
  };

  return (
    <div className={styles.homeContainer}>
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
          onUpdateRows={updateLaminates}
        />

        <h2 className={styles.subHeading}>Carvings list</h2>
        <PaginatedTable
          columns={carvingColumns}
          fetchPage={fetchCarvings}
          fetchFilteredPage={fetchFilteredCarvings}
          pageSize={10}
          initialOffset={0}
          onUpdateRows={updateCarvings}
        />
      </main>
    </div>
  );
}

export default Products;
