// src/components/PaginatedTable.jsx
import { useEffect, useState, useCallback } from "react";
import styles from "./index.module.css"; // ✅ CSS Module import

/**
 * columns: [{ key: 'id', header: 'ID', render?: (value, row) => ReactNode }]
 * fetchPage: async ({ offset, limit }) => { items: any[], hasMore: boolean }
 * pageSize: number (default 10)
 * initialOffset: number (default 0)
 */
function PaginatedTable({
  columns,
  fetchPage,
  pageSize = 10,
  initialOffset = 0,
}) {
  const [offset, setOffset] = useState(initialOffset);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError("");
    try {
      const { items, hasMore: more } = await fetchPage({ offset, limit: pageSize });
      setRows((prev) => [...prev, ...(items || [])]);
      setOffset((prev) => prev + (items?.length || 0));
      setHasMore(!!more);
    } catch (e) {
      console.error(e);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [fetchPage, hasMore, loading, offset, pageSize]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.header}</th>
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
              rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((c) => {
                    const value = row[c.key];
                    return (
                      <td key={c.key}>
                        {c.render ? c.render(value, row) : String(value ?? "")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.controls}>
        <button
          onClick={loadMore}
          disabled={loading || !hasMore}
          className={`${styles.button} ${hasMore ? styles.primary : ""}`}
        >
          {loading ? "Loading..." : hasMore ? "Load more" : "No more"}
        </button>
      </div>
    </div>
  );
}

export default PaginatedTable;

