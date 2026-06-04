import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import "./Admin.css";

const API_BASE_URL = "http://localhost:3005";
const socket = io(API_BASE_URL);

// ================= FORMAT ORDER =================
function formatOrder(order) {
  let total = 0;

  const formatted = Object.entries(order || {}).map(([category, items]) => {
    const categoryTotal = items.reduce(
      (sum, item) => sum + item.price * item.qt,
      0,
    );

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
  // ================= NAVIGATION =================
  const [activePage, setActivePage] = useState("history");

  // ================= HISTORY =================
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ================= MENU =================
  const [menu, setMenu] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("boissons");

  // ================= FORM =================
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    price: "",
    img: "",
  });

  const [loading, setLoading] = useState(false);

  // ================= FETCH HISTORY =================
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/history`);
      const data = await res.json();
      setHistory(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= FETCH MENU =================
  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/menu`);
      const data = await res.json();
      setMenu(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    fetchHistory();
    fetchMenu();
  }, []);

  // ================= SOCKET REAL-TIME SYNC =================
  useEffect(() => {
    socket.on("menu-update", (updatedMenu) => {
      setMenu(updatedMenu);
    });

    socket.on("new-order", () => {
      fetchHistory();
    });

    socket.on("tables-update", () => {
      // optional: you can fetch tables if needed
    });

    return () => {
      socket.off("menu-update");
      socket.off("new-order");
      socket.off("tables-update");
    };
  }, []);

  // ================= REFRESH =================
  const refreshAll = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchHistory(), fetchMenu()]);
    } finally {
      setLoading(false);
    }
  };

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

  // ================= STATS =================
  const stats = useMemo(() => {
    let revenue = 0;

    history.forEach((h) => {
      const { total } = formatOrder(h.order);

      if (h.status === "paid") {
        revenue += total;
      }
    });

    return {
      totalOrders: history.length,
      paidOrders: history.filter((h) => h.status === "paid").length,
      cancelledOrders: history.filter((h) => h.status === "cancelled").length,
      revenue,
    };
  }, [history]);

  // ================= ADD ITEM =================
  const addItem = async () => {
    try {
      await fetch(`${API_BASE_URL}/menu/${selectedCategory}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newItem,
          price: Number(newItem.price),
          type: selectedCategory,
        }),
      });

      setNewItem({
        title: "",
        description: "",
        price: "",
        img: "",
      });

      // no fetchMenu needed (socket handles it)
    } catch (err) {
      console.error(err);
    }
  };

  // ================= UPDATE PRICE =================
  const updatePrice = async (category, itemId, price) => {
    try {
      await fetch(`${API_BASE_URL}/menu/${category}/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price: Number(price),
        }),
      });

      // no fetchMenu needed
    } catch (err) {
      console.error(err);
    }
  };

  // ================= DELETE ITEM =================
  const deleteItem = async (category, itemId) => {
    if (!window.confirm("Delete this menu item ?")) return;

    try {
      await fetch(`${API_BASE_URL}/menu/${category}/${itemId}`, {
        method: "DELETE",
      });

      // no fetchMenu needed
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="adm-page">
      {/* ================= SIDEBAR ================= */}
      <aside className="adm-sidebar">
        <div className="adm-logo">
          <h2>🍽 Restaurant</h2>
          <p>Admin Dashboard</p>
        </div>

        <div className="adm-nav">
          <button
            className={activePage === "history" ? "adm-nav-active" : ""}
            onClick={() => setActivePage("history")}
          >
            📜 Orders History
          </button>

          <button
            className={activePage === "menu" ? "adm-nav-active" : ""}
            onClick={() => setActivePage("menu")}
          >
            🍔 Menu Manager
          </button>
        </div>

        <button className="adm-refresh-btn" onClick={refreshAll}>
          {loading ? "Refreshing..." : "🔄 Refresh"}
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="adm-main">
        {/* ================= STATS ================= */}
        <div className="adm-stats">
          <div className="adm-stat-card">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>

          <div className="adm-stat-card">
            <h3>{stats.paidOrders}</h3>
            <p>Paid Orders</p>
          </div>

          <div className="adm-stat-card">
            <h3>{stats.cancelledOrders}</h3>
            <p>Cancelled Orders</p>
          </div>

          <div className="adm-stat-card">
            <h3>{stats.revenue} MAD</h3>
            <p>Revenue</p>
          </div>
        </div>

        {/* ================= HISTORY ================= */}
        {activePage === "history" && (
          <>
            <div className="adm-page-header">
              <h1>Orders History</h1>

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
            </div>

            <div className="adm-grid">
              {filteredHistory.map((item) => {
                const { formatted, total } = formatOrder(item.order);

                return (
                  <div key={item.id} className="adm-card">
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

                    <div className="adm-total">
                      TOTAL: <span>{total} MAD</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ================= MENU ================= */}
        {activePage === "menu" && (
          <>
            <div className="adm-page-header">
              <h1>Menu Manager</h1>
            </div>

            <div className="adm-add-form">
              <h2>Add New Item</h2>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {Object.keys(menu).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <input
                placeholder="Title"
                value={newItem.title}
                onChange={(e) =>
                  setNewItem({ ...newItem, title: e.target.value })
                }
              />

              <input
                placeholder="Description"
                value={newItem.description}
                onChange={(e) =>
                  setNewItem({ ...newItem, description: e.target.value })
                }
              />

              <input
                placeholder="Image"
                value={newItem.img}
                onChange={(e) =>
                  setNewItem({ ...newItem, img: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: e.target.value })
                }
              />

              <button onClick={addItem}>Add Item</button>
            </div>

            {Object.entries(menu).map(([category, rows]) => (
              <div key={category} className="adm-menu-category">
                <h2>{category}</h2>

                {rows.flat().map((item) => (
                  <div key={item.id} className="adm-menu-item">
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </div>

                    <div className="adm-menu-actions">
                      <input
                        type="number"
                        defaultValue={item.price}
                        onBlur={(e) =>
                          updatePrice(category, item.id, e.target.value)
                        }
                      />

                      <button
                        className="adm-delete-btn"
                        onClick={() => deleteItem(category, item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
