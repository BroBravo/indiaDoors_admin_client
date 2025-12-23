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
            value: l.name,
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
            value: c.name,
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
      { key: "name", header: "Name", editType: "text" },
      {
        key: "mrp",
        header: "MRP(INR)",
        render: (v) => (v != null ? Number(v).toFixed(2) : ""),
        editType: "text",
      },
      {
        key: "price",
        header: "Price(INR)",
        render: (v) => (v != null ? Number(v).toFixed(2) : ""),
        editType: "text",
      },

       {
      key: "wood_type",
      header: "Wood Type",
      render: (v) => v || "jungle wood",
      editType: "select",          
      createType: "select",        
      selectOptions: [
        { value: "jungle wood", label: "Jungle wood" },
        { value: "saagon", label: "Saagon" },
      ],
      filterType: "select",
      filterOptions: [
        { value: "", label: "All" },
        { value: "jungle wood", label: "Jungle wood" },
        { value: "saagon", label: "Saagon" },
      ],
    },


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
        editType: "text",
      },
      {
        key: "height_in",
        header: "Height (in)",
        render: (v) => (v != null ? Number(v).toFixed(2) : ""),
        editType: "text",
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
      { key: "name", header: "Name", editType: "text" },
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
        header: "Price(INR)",
        render: (v) => (v != null ? Number(v).toFixed(2) : ""),
        editType: "text",
      },
      {
        key: "discount_perc",
        header: "Discount (%)",
        render: (v) => (v != null ? `${Number(v).toFixed(2)}%` : "0.00%"),
        editType: "text",
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

  /* ---------- Carving columns ---------- */

  const carvingColumns = useMemo(
    () =>
      laminateColumns.map((c) =>
        c.key === "id" ? { ...c, header: "Carving ID" } : c
      ),
    [laminateColumns]
  ); 

    /* ---------- Wood columns ---------- */

  const woodColumns = useMemo(
    () => [
      { key: "id", header: "Wood ID" },

      { key: "wood_name", header: "Name", editType: "text" },

      {
        key: "price_per_sqft",
        header: "Price/sqft(INR)",
        render: (v) => (v != null ? Number(v).toFixed(2) : ""),
        editType: "text",
      },

      {
        key: "is_active",
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


  /* ---------- API helpers ---------- */

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
      const { data } = await axios.post(
        `${baseURL}/admin/product/bulk-update`,
        {
          ids,
          filters,
          data: updateData,
        },
        { withCredentials: true }
      );
      return data;
    } catch (err) {
      console.error("updateProducts failed:", err);
      throw err;
    }
  };

  const createProduct = async (newData) => {
    // map only the columns we care about
    const payload = {
      name: newData.name ?? "",
      mrp: newData.mrp ?? null,
      price: newData.price ?? null,
      front_wrap: newData.front_wrap ?? null,
      back_wrap: newData.back_wrap ?? null,
      front_carving: newData.front_carving ?? null,
      back_carving: newData.back_carving ?? null,
      width_in: newData.width_in ?? null,
      height_in: newData.height_in ?? null,
    };

    const { data } = await axios.post(
      `${baseURL}/admin/product/upload`,
      payload,
      { withCredentials: true }
    );
    return data;
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
      const { data } = await axios.post(
        `${baseURL}/admin/product/laminate/bulk-update`,
        {
          ids,
          filters,
          data: updateData,
        },
        { withCredentials: true }
      );
      return data;
    } catch (err) {
      console.error("updateLaminates failed:", err);
      throw err;
    }
  };

  const createLaminate = async (newData) => {
    const fd = new FormData();
    fd.append("name", newData.name ?? "");
    if (newData.image_path instanceof File) {
      fd.append("image_path", newData.image_path);
    }
    if (newData.price != null) fd.append("price", newData.price);
    if (newData.discount_perc != null)
      fd.append("discount_perc", newData.discount_perc);
    fd.append(
      "active",
      newData.active != null ? newData.active : "1"
    );

    const { data } = await axios.post(
      `${baseURL}/admin/product/laminate/upload`,
      fd,
      { withCredentials: true }
    );
    return data;
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
      const { data } = await axios.post(
        `${baseURL}/admin/product/carving/bulk-update`,
        {
          ids,
          filters,
          data: updateData,
        },
        { withCredentials: true }
      );
      return data;
    } catch (err) {
      console.error("updateCarvings failed:", err);
      throw err;
    }
  };

  const createCarving = async (newData) => {
    const fd = new FormData();
    fd.append("name", newData.name ?? "");
    if (newData.image_path instanceof File) {
      fd.append("image_path", newData.image_path);
    }
    if (newData.price != null) fd.append("price", newData.price);
    if (newData.discount_perc != null)
      fd.append("discount_perc", newData.discount_perc);
    fd.append(
      "active",
      newData.active != null ? newData.active : "1"
    );

    const { data } = await axios.post(
      `${baseURL}/admin/product/carving/upload`,
      fd,
      { withCredentials: true }
    );
    return data;
  }; 

    const fetchWoods = async ({ offset, limit }) => {
    const { data } = await axios.get(
      `${baseURL}/admin/product/wood/get/table`,
      {
        params: { offset, limit },
        withCredentials: true,
      }
    );
    return { items: data.items || [], hasMore: !!data.hasMore };
  };

  const fetchFilteredWoods = async (filters = {}) => {
    const { offset = 0, limit = 10, ...otherFilters } = filters;
    const { data } = await axios.get(
      `${baseURL}/admin/product/wood/get/filter`,
      {
        params: { ...otherFilters, offset, limit },
        withCredentials: true,
      }
    );
    return { items: data.items || [], hasMore: !!data.hasMore };
  };

  const updateWoods = async ({ ids, filters, updateData }) => {
    try {
      const { data } = await axios.post(
        `${baseURL}/admin/product/wood/bulk-update`,
        {
          ids,
          filters,
          data: updateData,
        },
        { withCredentials: true }
      );
      return data;
    } catch (err) {
      console.error("updateWoods failed:", err);
      throw err;
    }
  };

  const createWood = async (newData) => {
    const payload = {
      wood_name: newData.wood_name ?? "",
      price: newData.price_per_sqft ?? null,
      // default to active if not explicitly set
      is_active:
        newData.is_active != null ? newData.is_active : 1,
    };

    const { data } = await axios.post(
      `${baseURL}/admin/product/wood/upload`,
      payload,
      { withCredentials: true }
    );
    return data;
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
          onCreateRow={createProduct}
        />

        <h2 className={styles.subHeading}>Laminates list</h2>
        <PaginatedTable
          columns={laminateColumns}
          fetchPage={fetchLaminates}
          fetchFilteredPage={fetchFilteredLaminates}
          pageSize={10}
          initialOffset={0}
          onUpdateRows={updateLaminates}
          onCreateRow={createLaminate}
        />

        <h2 className={styles.subHeading}>Carvings list</h2>
        <PaginatedTable
          columns={carvingColumns}
          fetchPage={fetchCarvings}
          fetchFilteredPage={fetchFilteredCarvings}
          pageSize={10}
          initialOffset={0}
          onUpdateRows={updateCarvings}
          onCreateRow={createCarving}
        />

        <h2 className={styles.subHeading}>Woods list</h2>
        <PaginatedTable
          columns={woodColumns}
          fetchPage={fetchWoods}
          fetchFilteredPage={fetchFilteredWoods}
          pageSize={10}
          initialOffset={0}
          onUpdateRows={updateWoods}
          onCreateRow={createWood}
        />

      </main>
    </div>
  );
}

export default Products;
