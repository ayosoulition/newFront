import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import "./Admin.css";

const API_BASE_URL = "http://localhost:3005";
const socket = io(API_BASE_URL);

// ─── Image upload (fires immediately on file pick) ───────────────────────────
const uploadImage = async (category, itemId, file, onStatus, token) => {
  onStatus("saving");
  try {
    const formData = new FormData();
    formData.append("image", file);
    const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!uploadRes.ok) throw new Error("Upload failed");
    const { filename } = await uploadRes.json();
    const putRes = await fetch(`${API_BASE_URL}/menu/${category}/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ img: filename }),
    });
    if (!putRes.ok) throw new Error("Save failed");
    onStatus("success");
  } catch {
    onStatus("error");
  }
};

// ─── Format order helper ─────────────────────────────────────────────────────
function formatOrder(order) {
  let total = 0;
  const formatted = Object.entries(order || {}).map(([category, items]) => {
    const categoryTotal = items.reduce(
      (sum, item) => sum + item.price * item.qt,
      0,
    );
    total += categoryTotal;
    return { category, items, categoryTotal };
  });
  return { formatted, total };
}

// ─── Status badge shown next to Save button ──────────────────────────────────
function SaveStatus({ status }) {
  if (status === "idle") return null;
  if (status === "saving")
    return <span className="adm-save-status saving">Saving…</span>;
  if (status === "success")
    return <span className="adm-save-status success">✓ Saved</span>;
  if (status === "error")
    return <span className="adm-save-status error">✕ Error</span>;
  return null;
}

// ─── Single editable menu item row ──────────────────────────────────────────
function MenuItemRow({ item, category, onDelete, token }) {
  const [draft, setDraft] = useState({
    title: item.title,
    description: item.description,
    price: item.price,
  });
  const [status, setStatus] = useState("idle");
  const [imgStatus, setImgStatus] = useState("idle");
  const timerRef = useRef(null);

  const isDirty =
    draft.title !== item.title ||
    draft.description !== item.description ||
    Number(draft.price) !== Number(item.price);

  const setStatusWithReset = (s) => {
    setStatus(s);
    clearTimeout(timerRef.current);
    if (s === "success" || s === "error") {
      timerRef.current = setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const setImgStatusWithReset = (s) => {
    setImgStatus(s);
    if (s === "success" || s === "error") {
      setTimeout(() => setImgStatus("idle"), 3000);
    }
  };

  const handleSave = async () => {
    setStatusWithReset("saving");
    try {
      const res = await fetch(`${API_BASE_URL}/menu/${category}/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          price: Number(draft.price),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatusWithReset("success");
    } catch {
      setStatusWithReset("error");
    }
  };

  return (
    <div className="adm-menu-item">
      <div className="adm-menu-thumb">
        <img className="adm-menu-image" src={item.img} alt={item.title} />
        <label
          className={`adm-img-overlay${imgStatus === "saving" ? " loading" : ""}`}
          title="Replace image"
        >
          {imgStatus === "saving"
            ? "…"
            : imgStatus === "success"
              ? "✓"
              : imgStatus === "error"
                ? "✕"
                : "📷"}
          <input
            className="adm-file-input"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file)
                uploadImage(
                  category,
                  item.id,
                  file,
                  setImgStatusWithReset,
                  token,
                );
            }}
          />
        </label>
      </div>

      <div className="adm-menu-fields">
        <div className="adm-menu-field">
          <label>Title</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Item name"
          />
        </div>
        <div className="adm-menu-field adm-menu-field--desc">
          <label>Description</label>
          <input
            type="text"
            value={draft.description}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
            placeholder="Short description"
          />
        </div>
        <div className="adm-menu-field adm-menu-field--price">
          <label>Price (MAD)</label>
          <input
            type="number"
            value={draft.price}
            onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
            placeholder="0"
          />
        </div>
      </div>

      <div className="adm-menu-row-actions">
        <SaveStatus status={status} />
        <button
          className={`adm-save-btn${!isDirty ? " adm-save-btn--disabled" : ""}${status === "saving" ? " adm-save-btn--loading" : ""}`}
          onClick={handleSave}
          disabled={!isDirty || status === "saving"}
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        <button
          className="adm-delete-btn"
          onClick={() => onDelete(category, item.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Admin() {
  const { logout, token } = useAuth();
  const [activePage, setActivePage] = useState("history");
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [menu, setMenu] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("boissons");
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    price: "",
    img: "",
  });
  const [loading, setLoading] = useState(false);
  const [addStatus, setAddStatus] = useState("idle");

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setHistory(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/menu`);
      const data = await res.json();
      setMenu(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchMenu();
  }, []);

  useEffect(() => {
    socket.on("menu-update", (m) => setMenu(m));
    socket.on("new-order", () => fetchHistory());
    return () => {
      socket.off("menu-update");
      socket.off("new-order");
    };
  }, []);

  const refreshAll = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchHistory(), fetchMenu()]);
    } finally {
      setLoading(false);
    }
  };

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

  const stats = useMemo(() => {
    let revenue = 0;
    history.forEach((h) => {
      const { total } = formatOrder(h.order);
      if (h.status === "paid") revenue += total;
    });
    return {
      totalOrders: history.length,
      paidOrders: history.filter((h) => h.status === "paid").length,
      cancelledOrders: history.filter((h) => h.status === "cancelled").length,
      revenue,
    };
  }, [history]);

  const addItem = async () => {
    if (!newItem.title || !newItem.price) return;
    setAddStatus("saving");
    try {
      const res = await fetch(`${API_BASE_URL}/menu/${selectedCategory}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newItem, price: Number(newItem.price) }),
      });
      if (!res.ok) throw new Error("Failed");
      setNewItem({ title: "", description: "", price: "", img: "" });
      setAddStatus("success");
      fetchMenu();
    } catch {
      setAddStatus("error");
    } finally {
      setTimeout(() => setAddStatus("idle"), 3000);
    }
  };

  const deleteItem = async (category, itemId) => {
    if (!window.confirm("Delete this menu item?")) return;
    try {
      await fetch(`${API_BASE_URL}/menu/${category}/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="adm-page">
      <aside className="adm-sidebar">
        <div className="adm-sidebar-top">
          <div className="adm-logo">
            <div className="adm-logo-icon">🍽</div>
            <div className="adm-logo-text">
              <h2>Restaurant</h2>
              <p>Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="adm-nav">
          <div className="adm-nav-label">Navigation</div>
          <button
            className={activePage === "history" ? "adm-nav-active" : ""}
            onClick={() => setActivePage("history")}
          >
            <span className="adm-nav-dot" />
            <span className="adm-nav-icon">📜</span>Orders History
          </button>
          <button
            className={activePage === "menu" ? "adm-nav-active" : ""}
            onClick={() => setActivePage("menu")}
          >
            <span className="adm-nav-dot" />
            <span className="adm-nav-icon">🍔</span>Menu Manager
          </button>
        </nav>

        <div className="adm-sidebar-bottom">
          <button
            className={`adm-refresh-btn${loading ? " spinning" : ""}`}
            onClick={refreshAll}
          >
            <span>↻</span>
            {loading ? "Refreshing…" : "Refresh data"}
          </button>
          <button
            className="adm-logout-btn"
            onClick={logout}
            style={{
              marginTop: "10px",
              padding: "10px",
              width: "100%",
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="adm-main">
        <div className="adm-stats">
          <div className="adm-stat-card">
            <div className="adm-stat-icon">📋</div>
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
          <div className="adm-stat-card green">
            <div className="adm-stat-icon">✅</div>
            <h3>{stats.paidOrders}</h3>
            <p>Paid Orders</p>
          </div>
          <div className="adm-stat-card red">
            <div className="adm-stat-icon">✕</div>
            <h3>{stats.cancelledOrders}</h3>
            <p>Cancelled</p>
          </div>
          <div className="adm-stat-card amber">
            <div className="adm-stat-icon">💰</div>
            <h3>{stats.revenue}</h3>
            <p>Revenue (MAD)</p>
          </div>
        </div>

        {activePage === "history" && (
          <>
            <div className="adm-page-header">
              <div>
                <h1>Orders History</h1>
                <p>{filteredHistory.length} orders found</p>
              </div>
              <div className="adm-filters">
                <input
                  type="text"
                  placeholder="Search by table or item…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon">📭</div>
                <h3>No orders found</h3>
                <p>Try adjusting your filters or search term.</p>
              </div>
            ) : (
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
                          {new Date(item.archivedAt).toLocaleDateString()}
                          <br />
                          {new Date(item.archivedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className="adm-card-body">
                        {formatted.map((cat, idx) => (
                          <div key={idx} className="adm-category">
                            <h4>{cat.category}</h4>
                            {cat.items.map((it) => (
                              <div key={it.id} className="adm-item">
                                <span>{it.title}</span>
                                <span>×{it.qt}</span>
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
                        <span className="adm-total-label">Order Total</span>
                        <span>{total} MAD</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activePage === "menu" && (
          <>
            <div className="adm-page-header">
              <div>
                <h1>Menu Manager</h1>
                <p>Add, edit or remove items from your menu</p>
              </div>
            </div>

            <div className="adm-add-form">
              <h2>➕ Add New Item</h2>
              <div className="adm-form-grid">
                <div className="adm-form-field">
                  <label>Category</label>
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
                </div>
                <div className="adm-form-field">
                  <label>Price (MAD)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newItem.price}
                    onChange={(e) =>
                      setNewItem({ ...newItem, price: e.target.value })
                    }
                  />
                </div>
                <div className="adm-form-field">
                  <label>Title</label>
                  <input
                    placeholder="Item name"
                    value={newItem.title}
                    onChange={(e) =>
                      setNewItem({ ...newItem, title: e.target.value })
                    }
                  />
                </div>
                <div className="adm-form-field">
                  <label>Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append("image", file);
                      const res = await fetch(`${API_BASE_URL}/upload`, {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                        body: fd,
                      });
                      const data = await res.json();
                      setNewItem((prev) => ({ ...prev, img: data.filename }));
                    }}
                  />
                </div>
                <div className="adm-form-field adm-form-full">
                  <label>Description</label>
                  <input
                    placeholder="Short description of the item"
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="adm-form-actions">
                <SaveStatus status={addStatus} />
                <button
                  className={`adm-add-btn${addStatus === "saving" ? " adm-add-btn--loading" : ""}`}
                  onClick={addItem}
                  disabled={addStatus === "saving"}
                >
                  {addStatus === "saving" ? "Adding…" : "＋ Add to Menu"}
                </button>
              </div>
            </div>

            {Object.entries(menu).map(([category, rows]) => {
              const items = rows.flat();
              return (
                <div key={category} className="adm-menu-category">
                  <div className="adm-menu-category-header">
                    <h2>
                      {category}
                      <span className="adm-category-badge">
                        {items.length} items
                      </span>
                    </h2>
                  </div>
                  {items.map((item) => (
                    <MenuItemRow
                      key={item.id}
                      item={item}
                      category={category}
                      onDelete={deleteItem}
                      token={token}
                    />
                  ))}
                </div>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}
