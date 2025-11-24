import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import styles from "./index.module.css";

function PaginatedTable({
  columns,
  fetchPage,
  fetchFilteredPage = null,
  pageSize = 10,
  initialOffset = 0,
  // Unified update callback
  // args: { ids: string[] | null, filters: object, updateData: object }
  onUpdateRows = null,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(() => {
        const initial = {};
        columns.forEach((c) => {
          if (c.filterType === "checkbox" && c.defaultChecked) {
            initial[c.key] = "1";      // value that means "checked"
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

  const nonEditableKeys = new Set(["id", "product_id", "created_at", "updated_at"]);

  const getRowId = (row) => row.id ?? row.product_id ?? row._id;

  // --- Helper to sanitize filters before sending
  const sanitizeFilters = (f) =>
    Object.fromEntries(
      Object.entries(f).filter(([_, v]) => v && v.trim() !== "")
    );

  const sanitizeUpdateData = (data) =>
    Object.fromEntries(
      Object.entries(data).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined
      )
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
        // ❌ no auto-select on bulk edit — selection is fully user-driven now
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
        // ❌ no auto-select here either
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
      loadPage(pageIndex); // restore previous normal page
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
    if (!onUpdateRows) return;
    if (!bulkEditMode) {
      // turning ON → no rows selected by default
      setSelectedIds(new Set());
      setBulkEditValues({});
      setBulkEditMode(true);
    } else {
      // turning OFF
      setBulkEditMode(false);
      setBulkEditValues({});
      setSelectedIds(new Set());
    }
  };

  const handleBulkEditChange = (key, value) => {
    setBulkEditValues((prev) => ({ ...prev, [key]: value }));
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

  // 👉 computed on each render: is this page fully selected?
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
        // If all currently selected → unselect all on this page
        for (const r of rows) {
          const id = getRowId(r);
          if (id != null) next.delete(id);
        }
      } else {
        // Otherwise select all rows on this page
        for (const r of rows) {
          const id = getRowId(r);
          if (id != null) next.add(id);
        }
      }

      return next;
    });
  };

  const applyBulkUpdate = async () => {
    if (!onUpdateRows) return;
    const sanitizedFilters = sanitizeFilters(filters);
    const updateData = sanitizeUpdateData(bulkEditValues);

    // Scenario:
    // - selectedIds.size > 0 -> update those IDs
    // - selectedIds.size === 0 -> treat as "all records" (IDs = null)
    const ids =
      selectedIds.size > 0 ? Array.from(selectedIds) : null;

    try {
      setUpdateLoading(true);
      setError("");
      await onUpdateRows({
        ids,
        filters: sanitizedFilters,
        updateData,
      });

      // refresh current page after successful update
      if (isFiltered) {
        await loadFilteredPage(filteredPageIndex);
      } else {
        await loadPage(pageIndex);
      }

      // reset bulk edit state
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
    if (!onUpdateRows || bulkEditMode) return;
    setEditingRow(row);
    setEditValues(row);
    setEditError("");
  };

  const handleSingleEditChange = (key, value) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
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
        ids: [id], // single record scenario
        filters: sanitizedFilters,
        updateData,
      });

      // refresh current page
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

  return (
    <div className={styles.tableContainer}>
      {/* === Top controls (edit toggle / select all / apply) === */}
      {onUpdateRows && (
        <div className={styles.topControls}>
          <button
            type="button"
            className={styles.button}
            onClick={toggleBulkEditMode}
            disabled={loading || updateLoading}
          >
            {bulkEditMode ? "Close Table Edit" : "Edit Table"}
          </button>

          {bulkEditMode && (
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
              {/* first column: edit or checkbox */}
              {onUpdateRows && <th style={{ width: "60px" }}>Edit</th>}
              {columns.map((c) => (
                <th key={c.key}>
                  <div>{c.header}</div>
                  {fetchFilteredPage && (
                    <>
                      {c.filterType === "select" ? (
                        // 🔽 dropdown filter (Active / Inactive / All)
                        <select
                          className={styles.selectFilter}
                          value={filters[c.key] ?? ""}        // "" => All
                          onChange={(e) =>
                            handleFilterChange(c.key, e.target.value)
                          }
                          disabled={updateLoading}
                        >
                          {(c.filterOptions || [{ value: "", label: "All" }]).map(
                            (opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            )
                          )}
                        </select>
                      ) : (
                        // 🔤 default text filter
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
            {/* Global edit row (only in bulk edit mode) */}
            {bulkEditMode && onUpdateRows && (
              <tr className={styles.bulkEditRow}>
                <td className={styles.bulkEditLabel}>Edit</td>
                {columns.map((c) => (
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
                ))}
              </tr>
            )}

            {rows.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={columns.length + (onUpdateRows ? 1 : 0)}
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
                      {onUpdateRows && (
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

                {/* pad empty rows */}
                {rows.length < pageSize &&
                  Array.from({ length: pageSize - rows.length }).map((_, i) => (
                    <tr key={`empty-${i}`} className={styles.emptyRow}>
                      {onUpdateRows && <td>&nbsp;</td>}
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

      {/* === Loading overlay (for data + updates) === */}
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
    </div>
  );
}

export default PaginatedTable;
