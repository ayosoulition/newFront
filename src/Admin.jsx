import { useEffect, useMemo, useState } from "react";
import "./Admin.css";

const API_BASE_URL = "http://localhost:3005";

// ================= FORMAT ORDER =================
function formatOrder(order) {
  let total = 0;

  const formatted = Object.entries(order || {}).map(([category, items]) => {
    const categoryTotal = items.reduce((sum, item) => {
      return sum + item.price * item.qt;
    }, 0);

    total += categoryTotal;

    return {
      category,
      items,
      categoryTotal,
    };
  });

  return { formatted, total };
}

export default function Admin() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // ================= FETCH HISTORY =================
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/history`);
      const data = await res.json();
      setHistory(data.data || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // ================= FILTER HISTORY =================
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchStatus =
        statusFilter === "all" || item.status === statusFilter;

      const matchSearch =
        item.tableNumber?.toString().includes(search) ||
        JSON.stringify(item.order).toLowerCase().includes(search.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [history, search, statusFilter]);

  return (
    <div className="adm-page">
      {/* ================= SIDEBAR ================= */}
      <aside className="adm-sidebar">
        <h2>🍽️ Admin Panel</h2>

        <button onClick={fetchHistory}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>

        <div className="adm-filters">
          <input
            type="text"
            placeholder="Search table or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="adm-main">
        <h1>Orders History</h1>

        <div className="adm-grid">
          {filteredHistory.length === 0 ? (
            <p>No orders found</p>
          ) : (
            filteredHistory.map((item) => {
              const { formatted, total } = formatOrder(item.order);

              return (
                <div key={item.id} className="adm-card">
                  {/* HEADER */}
                  <div className="adm-card-header">
                    <div>
                      <h3>Table {item.tableNumber}</h3>
                      <span className={`adm-status ${item.status}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="adm-date">
                      {new Date(item.archivedAt).toLocaleString()}
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="adm-card-body">
                    {formatted.map((cat, idx) => (
                      <div key={idx} className="adm-category">
                        <h4>{cat.category}</h4>

                        {cat.items.map((it) => (
                          <div key={it.id} className="adm-item">
                            <span>{it.title}</span>
                            <span>x{it.qt}</span>
                            <span>{it.price} MAD</span>
                            <span className="adm-sum">
                              {it.price * it.qt} MAD
                            </span>
                          </div>
                        ))}

                        <div className="adm-category-total">
                          Subtotal: {cat.categoryTotal} MAD
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* TOTAL */}
                  <div className="adm-total">
                    TOTAL: <span>{total} MAD</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
