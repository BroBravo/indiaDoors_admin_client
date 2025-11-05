
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./index.module.css";

function PaginatedTable({
  columns,
  fetchPage,
  fetchFilteredPage = null,
  pageSize = 10,
  initialOffset = 0,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({});
  const [hasMore, setHasMore] = useState(true);

  // Pagination states for normal and filtered tables
  const [pageIndex, setPageIndex] = useState(1);
  const [filteredPageIndex, setFilteredPageIndex] = useState(1);
  const [isFiltered, setIsFiltered] = useState(false);

  const hasActiveFilters = Object.values(filters).some(
    (v) => v && v.trim() !== ""
  );

  // --- Helper to sanitize filters before sending
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
        const { items, hasMore: more } = await fetchPage({ offset, limit: pageSize });
        setRows(items || []);
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
        setRows(items || []);
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
      loadPage(pageIndex); // restore previous normal page
    }
  }, [filters]);

  // --- Initial load
  useEffect(() => {
    loadPage(pageIndex);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Handle page navigation
  const handleNext = () => {
    if (loading || !hasMore) return;
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
    if (loading) return;
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

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>
                  <div>{c.header}</div>
                  {fetchFilteredPage && (
                    <input
                      type="text"
                      placeholder={`Search ${c.header}`}
                      value={filters[c.key] || ""}
                      onChange={(e) => handleFilterChange(c.key, e.target.value)}
                      className={styles.searchInput}
                      disabled={c.header==="Image"}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td colSpan={columns.length} className={styles.empty}>
                  No records
                </td>
              </tr>
            ) : (

              <>
              {rows.map((row) => (
                <tr key={row.id || row.product_id}>
                  {columns.map((c) => {
                    const value = row[c.key];
                    return (
                      <td key={c.key}>
                        {c.render ? c.render(value, row) : String(value ?? "")}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* 👇 pad empty rows to keep 10 visible */}
              {rows.length < pageSize &&
                Array.from({ length: pageSize - rows.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className={styles.emptyRow}>
                    {columns.map((c, j) => (
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
          disabled={loading || !hasMore}
          className={styles.iconButton}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default PaginatedTable;

