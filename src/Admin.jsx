import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import "./Admin.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const socket = io(API_BASE_URL);

// ─── SVG icon set ────────────────────────────────────────────────────────────
const ForkKnifeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
  </svg>
);

const ListIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const BookIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const ReceiptIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="2" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="12" y2="16" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XCircleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const BanknoteIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const UserIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CameraIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const InboxIcon = () => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
  >
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TableIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

// ─── Image upload ────────────────────────────────────────────────────────────
const uploadImage = async (category, itemId, file, onStatus, token) => {
  onStatus("saving");
  try {
    const formData = new FormData();
    formData.append("image", file);
    const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
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

// ─── Save status badge ───────────────────────────────────────────────────────
function SaveStatus({ status }) {
  if (status === "idle") return null;
  if (status === "saving")
    return <span className="adm-save-status saving">Enregistrement…</span>;
  if (status === "success")
    return <span className="adm-save-status success">✓ Enregistré</span>;
  if (status === "error")
    return <span className="adm-save-status error">✕ Erreur</span>;
  return null;
}

// ─── Menu item row ───────────────────────────────────────────────────────────
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
    if (s === "success" || s === "error")
      timerRef.current = setTimeout(() => setStatus("idle"), 3000);
  };

  const setImgStatusWithReset = (s) => {
    setImgStatus(s);
    if (s === "success" || s === "error")
      setTimeout(() => setImgStatus("idle"), 3000);
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
          title="Remplacer l'image"
        >
          {imgStatus === "saving" ? (
            "…"
          ) : imgStatus === "success" ? (
            "✓"
          ) : imgStatus === "error" ? (
            "✕"
          ) : (
            <CameraIcon />
          )}
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
          <label>Titre</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Nom de l'article"
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
            placeholder="Courte description"
          />
        </div>
        <div className="adm-menu-field adm-menu-field--price">
          <label>Prix (MAD)</label>
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
          {status === "saving" ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          className="adm-delete-btn"
          onClick={() => onDelete(category, item.id)}
        >
          Supprimer
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
        headers: { Authorization: `Bearer ${token}` },
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

  const filteredHistory = useMemo(
    () =>
      history.filter((item) => {
        const matchStatus =
          statusFilter === "all" || item.status === statusFilter;
        const matchSearch =
          item.tableNumber?.toString().includes(search) ||
          item.serverName?.toLowerCase().includes(search.toLowerCase()) ||
          JSON.stringify(item.order)
            .toLowerCase()
            .includes(search.toLowerCase());
        return matchStatus && matchSearch;
      }),
    [history, search, statusFilter],
  );

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
    if (!window.confirm("Supprimer cet article du menu ?")) return;
    try {
      await fetch(`${API_BASE_URL}/menu/${category}/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="adm-page">
      {/* ── Sidebar ── */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-top">
          <div className="adm-logo">
            <div className="adm-logo-icon">
              <ForkKnifeIcon />
            </div>
            <div className="adm-logo-text">
              <h2>Restaurant</h2>
              <p>Panneau Admin</p>
            </div>
          </div>
        </div>

        <nav className="adm-nav">
          <div className="adm-nav-label">Navigation</div>
          <button
            className={activePage === "history" ? "adm-nav-active" : ""}
            onClick={() => setActivePage("history")}
          >
            <span className="adm-nav-icon">
              <ListIcon />
            </span>
            Historique des Commandes
          </button>
          <button
            className={activePage === "menu" ? "adm-nav-active" : ""}
            onClick={() => setActivePage("menu")}
          >
            <span className="adm-nav-icon">
              <BookIcon />
            </span>
            Gestion du Menu
          </button>
        </nav>

        <div className="adm-sidebar-bottom">
          <button
            className={`adm-refresh-btn${loading ? " spinning" : ""}`}
            onClick={refreshAll}
          >
            <span className="adm-refresh-icon">
              <RefreshIcon />
            </span>
            {loading ? "Actualisation…" : "Actualiser"}
          </button>
          <button className="adm-logout-btn" onClick={logout}>
            <LogoutIcon />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="adm-main">
        {/* ── Stats strip ── */}
        <div className="adm-stats">
          <div className="adm-stat-card">
            <div className="adm-stat-icon">
              <ReceiptIcon />
            </div>
            <h3>{stats.totalOrders}</h3>
            <p>Total Commandes</p>
          </div>
          <div className="adm-stat-card green">
            <div className="adm-stat-icon">
              <CheckCircleIcon />
            </div>
            <h3>{stats.paidOrders}</h3>
            <p>Commandes Payées</p>
          </div>
          <div className="adm-stat-card red">
            <div className="adm-stat-icon">
              <XCircleIcon />
            </div>
            <h3>{stats.cancelledOrders}</h3>
            <p>Annulées</p>
          </div>
          <div className="adm-stat-card amber">
            <div className="adm-stat-icon">
              <BanknoteIcon />
            </div>
            <h3>{stats.revenue}</h3>
            <p>Revenus (MAD)</p>
          </div>
        </div>

        {/* ── Orders History ── */}
        {activePage === "history" && (
          <>
            <div className="adm-page-header">
              <div>
                <h1>Historique des Commandes</h1>
                <p>
                  {filteredHistory.length} commande
                  {filteredHistory.length !== 1 ? "s" : ""} trouvée
                  {filteredHistory.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="adm-filters">
                <input
                  type="text"
                  placeholder="Rechercher table, serveur ou article…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="paid">Payée</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon">
                  <InboxIcon />
                </div>
                <h3>Aucune commande trouvée</h3>
                <p>Essayez de modifier vos filtres ou votre recherche.</p>
              </div>
            ) : (
              <div className="adm-grid">
                {filteredHistory.map((item) => {
                  const { formatted, total } = formatOrder(item.order);
                  const d = new Date(item.archivedAt);
                  const dateStr = d.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  const timeStr = d.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div key={item.id} className="adm-card">
                      <div className="adm-card-header">
                        <div className="adm-card-info">
                          <span className="adm-card-table">
                            <TableIcon />
                            Table {item.tableNumber}
                          </span>
                          <span className={`adm-status ${item.status}`}>
                            {item.status === "paid" ? "Payée" : "Annulée"}
                          </span>
                          {item.serverName && (
                            <span className="adm-server-badge">
                              <UserIcon />
                              {item.serverName}
                            </span>
                          )}
                        </div>
                        <div className="adm-date">
                          {dateStr} · {timeStr}
                        </div>
                      </div>

                      <div className="adm-card-body">
                        {formatted.map((cat, idx) => (
                          <div key={idx} className="adm-category">
                            <h4>{cat.category}</h4>
                            {cat.items.map((it) => (
                              <div key={it.id} className="adm-item">
                                <span className="adm-item-name">
                                  {it.title}
                                </span>
                                <span className="adm-item-qty">×{it.qt}</span>
                                <span className="adm-item-price">
                                  {it.price} MAD
                                </span>
                                <span className="adm-sum">
                                  {it.price * it.qt} MAD
                                </span>
                              </div>
                            ))}
                            <div className="adm-category-total">
                              Sous-total : <strong>{cat.categoryTotal} MAD</strong>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="adm-total">
                        <span className="adm-total-label">Total Commande</span>
                        <span className="adm-total-amount">{total} MAD</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Menu Manager ── */}
        {activePage === "menu" && (
          <>
            <div className="adm-page-header">
              <div>
                <h1>Gestion du Menu</h1>
                <p>Ajouter, modifier ou supprimer des articles du menu</p>
              </div>
            </div>

            <div className="adm-add-form">
              <h2>
                <PlusIcon /> Ajouter un Article
              </h2>
              <div className="adm-form-grid">
                <div className="adm-form-field">
                  <label>Catégorie</label>
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
                  <label>Prix (MAD)</label>
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
                  <label>Titre</label>
                  <input
                    placeholder="Nom de l'article"
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
                        headers: { Authorization: `Bearer ${token}` },
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
                    placeholder="Courte description de l'article"
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
                  <PlusIcon />
                  {addStatus === "saving" ? "Ajout…" : "Ajouter au Menu"}
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
                        {items.length} article{items.length > 1 ? "s" : ""}
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
