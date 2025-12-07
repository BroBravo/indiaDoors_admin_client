import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import styles from "./index.module.css";
import { useUser } from "../../context/userContext";

/**
 * Generic image cell with hover + click preview.
 */
export function ImagePreviewCell({ src, label }) {
  const [hoverPos, setHoverPos] = useState(null); // { top, left } | null
  const [overlayOpen, setOverlayOpen] = useState(false);
  const thumbRef = useRef(null);

  if (!src) {
    return <span>{label || "-"}</span>;
  }

  const handleMouseEnter = () => {
    if (!thumbRef.current) return;
    const rect = thumbRef.current.getBoundingClientRect();
    setHoverPos({
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const handleMouseLeave = () => setHoverPos(null);

  const handleClickThumb = (e) => {
    e.stopPropagation();
    setOverlayOpen(true);
  };

  const handleCloseOverlay = () => setOverlayOpen(false);

  const hoverCard =
    hoverPos &&
    createPortal(
      <div
        className={styles.imageHoverCard}
        style={{
          top: hoverPos.top,
          left: hoverPos.left,
        }}
      >
        <img
          src={src}
          alt={label || "Preview"}
          className={styles.imageHoverImg}
        />
      </div>,
      document.body
    );

  const overlay =
    overlayOpen &&
    createPortal(
      <div className={styles.imageOverlay} onClick={handleCloseOverlay}>
        <div
          className={styles.imageOverlayInner}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={src}
            alt={label || "Preview large"}
            className={styles.imageOverlayImg}
          />
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <div className={styles.imageCell}>
        <div
          ref={thumbRef}
          className={styles.imageThumbWrapper}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClickThumb}
        >
          <img
            src={src}
            alt={label || "Preview"}
            className={styles.imageThumb}
          />
        </div>
        {label && <span>{label}</span>}
      </div>

      {hoverCard}
      {overlay}
    </>
  );
}

/* ================= PAGINATED TABLE ================= */

function PaginatedTable({
  columns,
  fetchPage,
  fetchFilteredPage = null,
  pageSize = 10,
  initialOffset = 0,
  // args: { ids: string[] | null, filters: object, updateData: object }
  onUpdateRows = null,
  // create callback: (newData: object) => Promise
  onCreateRow = null,
}) {
  
  const { user } = useUser();
  const canEditTables =
  user?.role === "admin" || user?.role === "superuser";

  // 👇 These are what the component will actually use
  const allowUpdate = !!onUpdateRows && canEditTables;
  const allowCreate = !!onCreateRow && canEditTables;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(() => {
    const initial = {};
    columns.forEach((c) => {
      if (c.filterType === "checkbox" && c.defaultChecked) {
        initial[c.key] = "1";
      }
    });
    return initial;
  });

  const [hasMore, setHasMore] = useState(true);

  // Pagination states for normal and filtered tables
  const [pageIndex, setPageIndex] = useState(1);
  const [filteredPageIndex, setFilteredPageIndex] = useState(1);
  const [isFiltered, setIsFiltered] = useState(false);

  const hasActiveFilters = Object.values(filters).some(
    (v) => v && v.trim() !== ""
  );

  // === EDIT / BULK EDIT STATE ===
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditValues, setBulkEditValues] = useState({});
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [updateLoading, setUpdateLoading] = useState(false);

  // Single-row edit modal
  const [editingRow, setEditingRow] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [editError, setEditError] = useState("");

  // Create modal
  const [creating, setCreating] = useState(false);
  const [createValues, setCreateValues] = useState({});
  const [createError, setCreateError] = useState("");

  const nonEditableKeys = new Set([
    "id",
    "product_id",
    "created_at",
    "updated_at",
  ]);

  const getRowId = (row) => row.id ?? row.product_id ?? row._id;

  // --- Helper to sanitize data before sending
  const sanitizeUpdateData = (data) =>
    Object.fromEntries(
      Object.entries(data).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined
      )
    );

  const sanitizeFilters = (f) =>
    Object.fromEntries(
      Object.entries(f).filter(([_, v]) => v && v.trim() !== "")
    );

  // --- Load normal data (paginated)
  const loadPage = useCallback(
    async (page) => {
      try {
        setLoading(true);
        setError("");
        const offset = (page - 1) * pageSize + initialOffset;
        const { items, hasMore: more } = await fetchPage({
          offset,
          limit: pageSize,
        });
        const safeItems = items || [];
        setRows(safeItems);
        setHasMore(!!more);
      } catch (err) {
        console.error(err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    },
    [fetchPage, pageSize, initialOffset]
  );

  // --- Load filtered data (paginated)
  const loadFilteredPage = useCallback(
    async (page) => {
      if (!fetchFilteredPage) return;
      try {
        setLoading(true);
        setError("");
        const sanitized = sanitizeFilters(filters);
        const offset = (page - 1) * pageSize + initialOffset;
        const { items, hasMore: more } = await fetchFilteredPage({
          ...sanitized,
          offset,
          limit: pageSize,
        });
        const safeItems = items || [];
        setRows(safeItems);
        setHasMore(!!more);
      } catch (err) {
        console.error(err);
        setError("Failed to load filtered data");
      } finally {
        setLoading(false);
      }
    },
    [fetchFilteredPage, filters, pageSize, initialOffset]
  );

  // --- React to filter changes
  useEffect(() => {
    if (hasActiveFilters) {
      setIsFiltered(true);
      setFilteredPageIndex(1);
      loadFilteredPage(1);
    } else {
      setIsFiltered(false);
      loadPage(pageIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // --- Initial load
  useEffect(() => {
    loadPage(pageIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Handle page navigation
  const handleNext = () => {
    if (loading || updateLoading || !hasMore) return;
    if (isFiltered) {
      const nextPage = filteredPageIndex + 1;
      setFilteredPageIndex(nextPage);
      loadFilteredPage(nextPage);
    } else {
      const nextPage = pageIndex + 1;
      setPageIndex(nextPage);
      loadPage(nextPage);
    }
  };

  const handlePrev = () => {
    if (loading || updateLoading) return;
    if (isFiltered && filteredPageIndex > 1) {
      const prevPage = filteredPageIndex - 1;
      setFilteredPageIndex(prevPage);
      loadFilteredPage(prevPage);
    } else if (!isFiltered && pageIndex > 1) {
      const prevPage = pageIndex - 1;
      setPageIndex(prevPage);
      loadPage(prevPage);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // === BULK EDIT HANDLERS ===

  const toggleBulkEditMode = () => {
    //if (!onUpdateRows) return;
    if (!allowUpdate) return;
    if (!bulkEditMode) {
      const initialBulkValues = {};
      columns.forEach((c) => {
        if (c.editType === "checkbox") {
          const fv = filters[c.key];
          if (fv === "1" || fv === "0") {
            initialBulkValues[c.key] = fv;
          }
        }
      });

      setSelectedIds(new Set());
      setBulkEditValues(initialBulkValues);
      setBulkEditMode(true);
    } else {
      setBulkEditMode(false);
      setBulkEditValues({});
      setSelectedIds(new Set());
    }
  };

  const handleBulkEditChange = (key, value) => {
    setBulkEditValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleBulkFileChange = (key, file) => {
    setBulkEditValues((prev) => ({ ...prev, [key]: file || undefined }));
  };

  const handleRowCheckboxChange = (row, checked) => {
    const id = getRowId(row);
    if (id == null) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const allSelectedThisPage =
    rows.length > 0 &&
    rows.every((r) => {
      const id = getRowId(r);
      return id != null && selectedIds.has(id);
    });

  const handleSelectAllCurrentPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (allSelectedThisPage) {
        for (const r of rows) {
          const id = getRowId(r);
          if (id != null) next.delete(id);
        }
      } else {
        for (const r of rows) {
          const id = getRowId(r);
          if (id != null) next.add(id);
        }
      }

      return next;
    });
  };

  const applyBulkUpdate = async () => {
    //if (!onUpdateRows) return;
     if (!allowUpdate) return;

    if (selectedIds.size === 0) {
      setError("No rows selected for bulk update.");
      return;
    }

    const sanitizedFilters = sanitizeFilters(filters);

    const rawUpdateData = { ...bulkEditValues };

    columns.forEach((c) => {
      if (c.editType === "checkbox") {
        const headerVal = filters[c.key]; // "", "1", "0"
        if (!headerVal) {
          delete rawUpdateData[c.key];
        } else if (rawUpdateData[c.key] === undefined) {
          if (headerVal === "1" || headerVal === "0") {
            rawUpdateData[c.key] = headerVal;
          }
        }
      }
    });

    const updateData = sanitizeUpdateData(rawUpdateData);

    if (Object.keys(updateData).length === 0) {
      setError("No changes specified for bulk update.");
      return;
    }

    const ids = Array.from(selectedIds);

    try {
      setUpdateLoading(true);
      setError("");
      await onUpdateRows({
        ids,
        filters: sanitizedFilters,
        updateData,
      });

      if (isFiltered) {
        await loadFilteredPage(filteredPageIndex);
      } else {
        await loadPage(pageIndex);
      }

      setBulkEditMode(false);
      setBulkEditValues({});
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      setError("Failed to apply updates.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // === SINGLE ROW EDIT HANDLERS ===

  const startSingleEdit = (row) => {
    // if (!onUpdateRows || bulkEditMode) return;
    if (!allowUpdate || bulkEditMode) return;
    setEditingRow(row);
    setEditValues(row);
    setEditError("");
  };

  const handleSingleEditChange = (key, value) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSingleFileChange = (key, file) => {
    setEditValues((prev) => ({ ...prev, [key]: file || undefined }));
  };

  const cancelSingleEdit = () => {
    setEditingRow(null);
    setEditValues({});
    setEditError("");
  };

  const saveSingleEdit = async () => {
    if (!onUpdateRows || !editingRow) return;
    const sanitizedFilters = sanitizeFilters(filters);
    const updateData = sanitizeUpdateData(editValues);
    const id = getRowId(editingRow);
    if (id == null) return;

    try {
      setUpdateLoading(true);
      setEditError("");
      await onUpdateRows({
        ids: [id],
        filters: sanitizedFilters,
        updateData,
      });

      if (isFiltered) {
        await loadFilteredPage(filteredPageIndex);
      } else {
        await loadPage(pageIndex);
      }

      setEditingRow(null);
      setEditValues({});
    } catch (err) {
      console.error(err);
      setEditError("Failed to save changes.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // === CREATE HANDLERS ===

  const startCreate = () => {
    // if (!onCreateRow || updateLoading || loading) return;
     if (!allowCreate || updateLoading || loading) return;
    setCreateValues({});
    setCreateError("");
    setCreating(true);
  };

  const cancelCreate = () => {
    setCreating(false);
    setCreateValues({});
    setCreateError("");
  };

  const handleCreateChange = (key, value) => {
    setCreateValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateFileChange = (key, file) => {
    setCreateValues((prev) => ({ ...prev, [key]: file || undefined }));
  };

  const saveCreate = async () => {
    // if (!onCreateRow) return;
    if (!allowCreate) return;
    const data = sanitizeUpdateData(createValues);
    if (Object.keys(data).length === 0) {
      setCreateError("Please fill at least one field.");
      return;
    }

    try {
      setUpdateLoading(true);
      setCreateError("");
      await onCreateRow(data);

      // after create, reload first page (respect filters)
      if (hasActiveFilters && fetchFilteredPage) {
        setIsFiltered(true);
        setFilteredPageIndex(1);
        await loadFilteredPage(1);
      } else {
        setIsFiltered(false);
        setPageIndex(1);
        await loadPage(1);
      }

      setCreating(false);
      setCreateValues({});
    } catch (err) {
      console.error(err);
      setCreateError("Failed to create record.");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className={styles.tableContainer}>
    {(allowUpdate || allowCreate) && (
        <div className={styles.topControls}>
          {allowUpdate && (
            <button
              type="button"
              className={styles.button}
              onClick={toggleBulkEditMode}
              disabled={loading || updateLoading}
            >
              {bulkEditMode ? "Close Table Edit" : "Edit Table"}
            </button>
          )}

          {allowCreate && (
            <button
              type="button"
              className={styles.button}
              onClick={startCreate}
              disabled={loading || updateLoading}
            >
              Add Row
            </button>
          )}

          {bulkEditMode && allowUpdate && (
            <>
              <button
                type="button"
                className={styles.button}
                onClick={handleSelectAllCurrentPage}
                disabled={loading || updateLoading || rows.length === 0}
              >
                {allSelectedThisPage
                  ? "Unselect All (this page)"
                  : "Select All (this page)"}
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.primary}`}
                onClick={applyBulkUpdate}
                disabled={loading || updateLoading}
              >
                Apply Changes
              </button>
            </>
          )}
        </div>
    )}


      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {allowUpdate && <th style={{ width: "60px" }}>Edit</th>}
              {columns.map((c) => (
                <th key={c.key}>
                  <div>{c.header}</div>
                  {fetchFilteredPage && (
                    <>
                      {c.filterType === "select" ? (
                        <select
                          className={styles.selectFilter}
                          value={filters[c.key] ?? ""}
                          onChange={(e) =>
                            handleFilterChange(c.key, e.target.value)
                          }
                          disabled={updateLoading}
                        >
                          {(c.filterOptions || [
                            { value: "", label: "All" },
                          ]).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder={`Search ${c.header}`}
                          value={filters[c.key] || ""}
                          onChange={(e) =>
                            handleFilterChange(c.key, e.target.value)
                          }
                          className={styles.searchInput}
                          disabled={c.header === "Image" || updateLoading}
                        />
                      )}
                    </>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {bulkEditMode && allowUpdate && (
              <tr className={styles.bulkEditRow}>
                <td className={styles.bulkEditLabel}>Edit</td>
                {columns.map((c) => {
                  const headerVal = filters[c.key];

                  if (c.editType === "checkbox") {
                    const effectiveVal =
                      bulkEditValues[c.key] ??
                      (headerVal === "1" || headerVal === "0"
                        ? headerVal
                        : "");
                    return (
                      <td key={c.key}>
                        <input
                          type="checkbox"
                          className={styles.bulkEditCheckbox}
                          checked={effectiveVal === "1"}
                          onChange={(e) =>
                            handleBulkEditChange(
                              c.key,
                              e.target.checked ? "1" : "0"
                            )
                          }
                          disabled={
                            nonEditableKeys.has(c.key) ||
                            updateLoading ||
                            !headerVal
                          }
                        />
                      </td>
                    );
                  }

                  if (c.editType === "select") {
                    const options = c.selectOptions || c.editOptions || [];
                    return (
                      <td key={c.key}>
                        <select
                          className={styles.editSelect}
                          value={bulkEditValues[c.key] ?? ""}
                          onChange={(e) =>
                            handleBulkEditChange(c.key, e.target.value)
                          }
                          disabled={nonEditableKeys.has(c.key) || updateLoading}
                        >
                          <option value="">
                            {`(no change to ${c.header})`}
                          </option>
                          {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  }

                  if (c.editType === "file") {
                    return (
                      <td key={c.key}>
                        <input
                          type="file"
                          accept="image/*"
                          className={styles.bulkFileInput}
                          onChange={(e) =>
                            handleBulkFileChange(
                              c.key,
                              e.target.files?.[0] || null
                            )
                          }
                          disabled={nonEditableKeys.has(c.key) || updateLoading}
                        />
                      </td>
                    );
                  }

                  return (
                    <td key={c.key}>
                      <input
                        type="text"
                        className={styles.bulkEditInput}
                        placeholder={`New ${c.header}`}
                        value={bulkEditValues[c.key] ?? ""}
                        onChange={(e) =>
                          handleBulkEditChange(c.key, e.target.value)
                        }
                        disabled={nonEditableKeys.has(c.key) || updateLoading}
                      />
                    </td>
                  );
                })}
              </tr>
            )}

            {rows.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={columns.length + (allowUpdate ? 1 : 0)}
                  className={styles.empty}
                >
                  No records
                </td>
              </tr>
            ) : (
              <>
                {rows.map((row) => {
                  const id = getRowId(row);
                  const isSelected = selectedIds.has(id);
                  return (
                    <tr key={id ?? Math.random()}>
                      {allowUpdate && (
                        <td>
                          {bulkEditMode ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) =>
                                handleRowCheckboxChange(row, e.target.checked)
                              }
                              disabled={updateLoading}
                            />
                          ) : (
                            <button
                              type="button"
                              className={styles.iconButton}
                              onClick={() => startSingleEdit(row)}
                              disabled={updateLoading}
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                        </td>
                      )}

                      {columns.map((c) => {
                        const value = row[c.key];
                        return (
                          <td key={c.key}>
                            {c.render
                              ? c.render(value, row)
                              : String(value ?? "")}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {rows.length < pageSize &&
                  Array.from({ length: pageSize - rows.length }).map((_, i) => (
                    <tr key={`empty-${i}`} className={styles.emptyRow}>
                      {allowUpdate && <td>&nbsp;</td>}
                      {columns.map((_, j) => (
                        <td key={j}>&nbsp;</td>
                      ))}
                    </tr>
                  ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.controls}>
        <button
          onClick={handlePrev}
          disabled={
            loading ||
            updateLoading ||
            (isFiltered ? filteredPageIndex <= 1 : pageIndex <= 1)
          }
          className={styles.iconButton}
        >
          <ChevronLeft size={20} />
        </button>

        <span className={styles.pageIndicator}>
          Page {isFiltered ? filteredPageIndex : pageIndex}
        </span>

        <button
          onClick={handleNext}
          disabled={loading || updateLoading || !hasMore}
          className={styles.iconButton}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {(loading || updateLoading) && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>
            {updateLoading ? "Applying updates..." : "Loading..."}
          </div>
        </div>
      )}

      {/* === Single-row edit modal === */}
      {editingRow && (
        <div className={styles.editOverlay}>
          <div className={styles.editModal}>
            <h3 className={styles.editTitle}>Edit Row</h3>

            <div className={styles.editBody}>
              {columns.map((c) => {
                const key = c.key;
                const value = editValues[key] ?? "";
                const readOnly = nonEditableKeys.has(key);
                const editType = c.editType || "text";
                const options = c.selectOptions || c.editOptions || [];

                if (editType === "checkbox") {
                  return (
                    <div key={key} className={styles.editField}>
                      <label className={styles.editLabel}>{c.header}</label>
                      <input
                        type="checkbox"
                        checked={
                          value === 1 || value === "1" || value === true
                        }
                        disabled={readOnly || updateLoading}
                        onChange={(e) =>
                          handleSingleEditChange(
                            key,
                            e.target.checked ? "1" : "0"
                          )
                        }
                      />
                    </div>
                  );
                }

                if (editType === "select") {
                  return (
                    <div key={key} className={styles.editField}>
                      <label className={styles.editLabel}>{c.header}</label>
                      <select
                        className={styles.editSelect}
                        value={value ?? ""}
                        disabled={readOnly || updateLoading}
                        onChange={(e) =>
                          handleSingleEditChange(key, e.target.value)
                        }
                      >
                        <option value="">Select {c.header}</option>
                        {options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (editType === "file") {
                  const originalSrc =
                    typeof c.getImageSrc === "function"
                      ? c.getImageSrc(editingRow)
                      : null;

                  const selectedFile = value instanceof File ? value : null;
                  const previewSrc = selectedFile
                    ? URL.createObjectURL(selectedFile)
                    : originalSrc;

                  return (
                    <div key={key} className={styles.editField}>
                      <label className={styles.editLabel}>{c.header}</label>
                      <div className={styles.fileEditWrapper}>
                        {previewSrc && (
                          <img
                            src={previewSrc}
                            alt={c.header}
                            className={styles.fileEditPreview}
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleSingleFileChange(
                              key,
                              e.target.files?.[0] || null
                            )
                          }
                          disabled={readOnly || updateLoading}
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={key} className={styles.editField}>
                    <label className={styles.editLabel}>{c.header}</label>
                    <input
                      className={styles.editInput}
                      type="text"
                      value={value}
                      disabled={readOnly || updateLoading}
                      onChange={(e) =>
                        handleSingleEditChange(key, e.target.value)
                      }
                    />
                  </div>
                );
              })}
            </div>

            {editError && <div className={styles.error}>{editError}</div>}

            <div className={styles.editActions}>
              <button
                type="button"
                className={styles.button}
                onClick={cancelSingleEdit}
                disabled={updateLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.primary}`}
                onClick={saveSingleEdit}
                disabled={updateLoading}
              >
                {updateLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Create new row modal === */}
      {creating && (
        <div className={styles.editOverlay}>
          <div className={styles.editModal}>
            <h3 className={styles.editTitle}>Add New Row</h3>

            <div className={styles.editBody}>
              {columns.map((c) => {
                const key = c.key;
                if (nonEditableKeys.has(key)) return null;

                const value = createValues[key] ?? "";
                const fieldType = c.createType || c.editType || "text";
                const options = c.selectOptions || c.editOptions || [];

                if (fieldType === "checkbox") {
                  return (
                    <div key={key} className={styles.editField}>
                      <label className={styles.editLabel}>{c.header}</label>
                      <input
                        type="checkbox"
                        checked={
                          value === 1 || value === "1" || value === true
                        }
                        disabled={updateLoading}
                        onChange={(e) =>
                          handleCreateChange(
                            key,
                            e.target.checked ? "1" : "0"
                          )
                        }
                      />
                    </div>
                  );
                }

                if (fieldType === "select") {
                  return (
                    <div key={key} className={styles.editField}>
                      <label className={styles.editLabel}>{c.header}</label>
                      <select
                        className={styles.editSelect}
                        value={value ?? ""}
                        disabled={updateLoading}
                        onChange={(e) =>
                          handleCreateChange(key, e.target.value)
                        }
                      >
                        <option value="">Select {c.header}</option>
                        {options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (fieldType === "file") {
                  const selectedFile = value instanceof File ? value : null;
                  const previewSrc = selectedFile
                    ? URL.createObjectURL(selectedFile)
                    : null;

                  return (
                    <div key={key} className={styles.editField}>
                      <label className={styles.editLabel}>{c.header}</label>
                      <div className={styles.fileEditWrapper}>
                        {previewSrc && (
                          <img
                            src={previewSrc}
                            alt={c.header}
                            className={styles.fileEditPreview}
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleCreateFileChange(
                              key,
                              e.target.files?.[0] || null
                            )
                          }
                          disabled={updateLoading}
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={key} className={styles.editField}>
                    <label className={styles.editLabel}>{c.header}</label>
                    <input
                      className={styles.editInput}
                      type="text"
                      value={value}
                      disabled={updateLoading}
                      onChange={(e) =>
                        handleCreateChange(key, e.target.value)
                      }
                    />
                  </div>
                );
              })}
            </div>

            {createError && <div className={styles.error}>{createError}</div>}

            <div className={styles.editActions}>
              <button
                type="button"
                className={styles.button}
                onClick={cancelCreate}
                disabled={updateLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.primary}`}
                onClick={saveCreate}
                disabled={updateLoading}
              >
                {updateLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaginatedTable;
