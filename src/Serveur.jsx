import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";
import "./Serveur.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const STATUS_LABELS = {
  ordered: "Commande 🔔",
  confirmed: "Confirmée",
  ready: "Prête 🍳",
  notPayed: "Non payée",
  bill: "Addition 💰",
};

const STATUS_COLORS = {
  ordered: "#ea580c",
  confirmed: "#2563eb",
  ready: "#d97706",
  notPayed: "#dc2626",
  bill: "#7c3aed",
};

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "ordered", label: "Commandes" },
  { key: "confirmed", label: "Confirmées" },
  { key: "ready", label: "Prêtes" },
  { key: "notPayed", label: "Non payées" },
  { key: "bill", label: "Addition" },
];

export default function Serveur() {
  const { logout, token, user } = useAuth();
  const socketRef = useRef(null);

  const [tables, setTables] = useState({});
  const [orders, setOrders] = useState({});
  const [selectedTable, setSelectedTable] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all"); // "all" | "mine"
  const [searchTable, setSearchTable] = useState("");

  const prevTablesRef = useRef({});
  const prevOrdersRef = useRef({});
  const notifSoundRef = useRef(null);

  // ── Audio ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const sound = new Audio("/assets/notif.wav");
    sound.preload = "auto";
    sound.load();
    notifSoundRef.current = sound;

    const unlock = () => {
      sound
        .play()
        .then(() => {
          sound.pause();
          sound.currentTime = 0;
        })
        .catch(() => {});
    };
    window.addEventListener("click", unlock, { once: true });
    return () => window.removeEventListener("click", unlock);
  }, []);

  const playSound = useCallback(() => {
    const s = notifSoundRef.current;
    if (!s) return;
    s.currentTime = 0;
    s.play().catch(() => {});
  }, []);

  // ── Socket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !user) return;

    const socket = io(API_BASE_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("server-join", { serverId: user.id });
    });

    Promise.all([
      fetch(`${API_BASE_URL}/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([tablesData, ordersData]) => {
        prevTablesRef.current = tablesData;
        prevOrdersRef.current = ordersData;
        setTables(tablesData);
        setOrders(ordersData);
      })
      .catch(() =>
        toast.error("Erreur de chargement des données", {
          position: "top-right",
        }),
      );

    socket.on("new-order", (data) => {
      const prev = prevOrdersRef.current;
      Object.keys(data).forEach((tableId) => {
        if (!prev[tableId]) {
          playSound();
          toast.info(`🔔 Nouvelle commande — Table ${tableId}`, {
            position: "top-right",
            autoClose: 8000,
          });
        }
      });
      prevOrdersRef.current = data;
      setOrders(data);
    });

    socket.on("tables-update", (newTables) => {
      const prev = prevTablesRef.current;
      for (const tableId in newTables) {
        const next = newTables[tableId];
        const old = prev[tableId];
        if (!old || old.status === next.status) continue;
        if (next.status === "bill" && next.serverId === user.id) {
          playSound();
          toast.warning(`💰 Table ${tableId} demande l'addition`, {
            position: "top-right",
            autoClose: false,
            toastId: `bill-${tableId}`,
          });
        }
      }
      prevTablesRef.current = newTables;
      setTables(newTables);
    });

    socket.on("order-ready", ({ tableId }) => {
      playSound();
      toast.success(`🍳 Commande prête — Table ${tableId}`, {
        position: "top-right",
        autoClose: false,
        toastId: `ready-${tableId}`,
      });
      setTables((prev) => ({
        ...prev,
        [tableId]: { ...prev[tableId], status: "ready" },
      }));
    });

    return () => socket.disconnect();
  }, [token, user, playSound]);

  // ── HTTP helper ─────────────────────────────────────────────────────────
  const patchStatus = (tableId, action) =>
    fetch(`${API_BASE_URL}/tables/${tableId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });

  // ── Optimistic update ───────────────────────────────────────────────────
  const applyOptimistic = useCallback(
    (tableId, action) => {
      const clearsTable = action === "paid" || action === "cancel";
      if (clearsTable) {
        setOrders((prev) => {
          const c = { ...prev };
          delete c[tableId];
          return c;
        });
        toast.dismiss(`bill-${tableId}`);
        toast.dismiss(`ready-${tableId}`);
      }
      setTables((prev) => ({
        ...prev,
        [tableId]: {
          ...prev[tableId],
          status:
            action === "confirm"
              ? "confirmed"
              : action === "served"
                ? "notPayed"
                : clearsTable
                  ? "empty"
                  : prev[tableId]?.status,
          serverName: clearsTable
            ? null
            : action === "confirm"
              ? user?.username
              : prev[tableId]?.serverName,
          serverId: clearsTable
            ? null
            : action === "confirm"
              ? user?.id
              : prev[tableId]?.serverId,
        },
      }));
    },
    [user],
  );

  // ── Action dispatcher ───────────────────────────────────────────────────
  const doAction = async (tableId, action) => {
    setSelectedTable(null);
    try {
      const res = await patchStatus(tableId, action);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error || `Erreur ${res.status}`, {
          position: "top-right",
        });
        fetch(`${API_BASE_URL}/tables`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then(setTables);
        return;
      }
      applyOptimistic(tableId, action);
    } catch {
      toast.error("Erreur réseau", { position: "top-right" });
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const getItemCount = (tableId) => {
    const o = orders[tableId]?.order;
    if (!o) return 0;
    return Object.values(o).reduce(
      (s, items) => s + items.reduce((a, i) => a + i.qt, 0),
      0,
    );
  };

  const getOrderTotal = (tableId) => {
    const o = orders[tableId]?.order;
    if (!o) return 0;
    return Object.values(o).reduce(
      (s, items) => s + items.reduce((a, i) => a + i.price * i.qt, 0),
      0,
    );
  };

  // ── Derived data ────────────────────────────────────────────────────────
  const selData = tables[selectedTable];
  const selStatus = selData?.status;
  const isMine = !selData?.serverId || selData?.serverId === user?.id;

  const stats = useMemo(() => {
    const vals = Object.values(tables);
    return {
      pending: vals.filter((t) => t.status === "ordered").length,
      myTables: vals.filter(
        (t) => t.serverId === user?.id && t.status !== "empty",
      ).length,
      ready: vals.filter((t) => t.status === "ready" && t.serverId === user?.id)
        .length,
      bill: vals.filter((t) => t.status === "bill" && t.serverId === user?.id)
        .length,
    };
  }, [tables, user]);

  const ownerCounts = useMemo(() => {
    const vals = Object.values(tables).filter((t) => t.status !== "empty");
    return {
      all: vals.length,
      mine: vals.filter((t) => t.serverId === user?.id).length,
    };
  }, [tables, user]);

  const tabCounts = useMemo(() => {
    const base = Object.values(tables).filter(
      (t) =>
        t.status !== "empty" &&
        (ownerFilter === "all" || t.serverId === user?.id),
    );
    return {
      all: base.length,
      ordered: base.filter((t) => t.status === "ordered").length,
      confirmed: base.filter((t) => t.status === "confirmed").length,
      ready: base.filter((t) => t.status === "ready").length,
      notPayed: base.filter((t) => t.status === "notPayed").length,
      bill: base.filter((t) => t.status === "bill").length,
    };
  }, [tables, user, ownerFilter]);

  const filteredTables = Object.keys(tables).filter((id) => {
    const t = tables[id];
    if (t.status === "empty") return false;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchSearch = id.includes(searchTable.trim());
    const matchOwner = ownerFilter === "all" || t.serverId === user?.id;
    return matchStatus && matchSearch && matchOwner;
  });

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "?";

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-logo">
          🍽
          <span>Serveur</span>
          <span className="header-role">Salle</span>
        </div>
        {user && (
          <div className="header-user">
            <div className="header-avatar">{initials}</div>
            <span className="header-username">{user.username}</span>
          </div>
        )}
        <button className="header-logout" onClick={logout}>
          Déconnexion
        </button>
      </header>

      <main className="main-content">
        {/* STATS STRIP */}
        <div className="stats-strip">
          <div
            className={`stat-pill${statusFilter === "ordered" ? " active-stat" : ""}`}
            onClick={() =>
              setStatusFilter((s) => (s === "ordered" ? "all" : "ordered"))
            }
          >
            <span className="stat-icon">🔔</span>
            <span className="stat-label">En attente</span>
            <span className="stat-count">{stats.pending}</span>
          </div>
          <div
            className={`stat-pill${ownerFilter === "mine" ? " active-stat" : ""}`}
            onClick={() =>
              setOwnerFilter((o) => (o === "mine" ? "all" : "mine"))
            }
          >
            <span className="stat-icon">📋</span>
            <span className="stat-label">Mes tables</span>
            <span className="stat-count">{stats.myTables}</span>
          </div>
          {stats.ready > 0 && (
            <div
              className={`stat-pill${statusFilter === "ready" && ownerFilter === "mine" ? " active-stat" : ""}`}
              onClick={() => {
                setStatusFilter("ready");
                setOwnerFilter("mine");
              }}
            >
              <span className="stat-icon">🍳</span>
              <span className="stat-label">Prêtes</span>
              <span className="stat-count">{stats.ready}</span>
            </div>
          )}
          {stats.bill > 0 && (
            <div
              className={`stat-pill${statusFilter === "bill" && ownerFilter === "mine" ? " active-stat" : ""}`}
              onClick={() => {
                setStatusFilter("bill");
                setOwnerFilter("mine");
              }}
            >
              <span className="stat-icon">💰</span>
              <span className="stat-label">Additions</span>
              <span className="stat-count">{stats.bill}</span>
            </div>
          )}
        </div>

        {/* FILTERS */}
        <div className="filter-section">
          <div className="filter-top">
            <input
              className="search-input"
              type="text"
              placeholder="Rechercher une table..."
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
            />
            <div className="owner-toggle">
              <button
                className={`toggle-opt${ownerFilter === "all" ? " active-toggle" : ""}`}
                onClick={() => setOwnerFilter("all")}
              >
                Toutes <span className="toggle-badge">{ownerCounts.all}</span>
              </button>
              <button
                className={`toggle-opt${ownerFilter === "mine" ? " active-toggle" : ""}`}
                onClick={() => setOwnerFilter("mine")}
              >
                Mes tables{" "}
                <span className="toggle-badge">{ownerCounts.mine}</span>
              </button>
            </div>
          </div>
          <div className="filter-tabs">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                className={`filter-tab${statusFilter === key ? " active-tab" : ""}`}
                onClick={() => setStatusFilter(key)}
              >
                {label}
                <span className="tab-count">{tabCounts[key] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* TABLE GRID */}
        <section className="tables-grid">
          {filteredTables.length === 0 ? (
            <div className="empty-state">
              <p>Aucune table à afficher</p>
              <small>
                {ownerFilter === "mine"
                  ? "Vous n'avez pas de tables actives en ce moment"
                  : "Toutes les tables sont libres"}
              </small>
            </div>
          ) : (
            filteredTables.map((tableId) => {
              const t = tables[tableId];
              const mine = t.serverId === user?.id;
              const taken = !!t.serverId && !mine;
              const count = getItemCount(tableId);
              return (
                <div
                  key={tableId}
                  onClick={() => setSelectedTable(tableId)}
                  className={`table-card status-${t.status}${mine ? " mine" : taken ? " claimed" : ""}`}
                >
                  <div className="table-card-header">
                    <span>{STATUS_LABELS[t.status] || t.status}</span>
                    {t.serverName && (
                      <span className="card-server-badge">{t.serverName}</span>
                    )}
                  </div>
                  <div className="table-card-body">
                    <span className="table-label">Table</span>
                    <span className="table-number">{tableId}</span>
                    {count > 0 && (
                      <span className="card-items">
                        {count} plat{count > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* MODAL */}
      {selectedTable && (
        <div className="modal-overlay" onClick={() => setSelectedTable(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag" />

            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-title">Table {selectedTable}</div>
                <div
                  className="modal-status"
                  style={{ background: STATUS_COLORS[selStatus] || "#666" }}
                >
                  {STATUS_LABELS[selStatus] || selStatus}
                </div>
                {selData?.serverName && (
                  <div className="modal-server-info">
                    👤 {selData.serverName}
                    {selData.serverId === user?.id && (
                      <span className="modal-you-tag">Vous</span>
                    )}
                  </div>
                )}
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedTable(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {orders[selectedTable]?.order ? (
                <>
                  {Object.entries(orders[selectedTable].order).map(
                    ([cat, items]) => (
                      <div className="order-section" key={cat}>
                        <div className="order-category">{cat}</div>
                        {items.map((item) => (
                          <div key={item.id} className="item-card">
                            <img className="item-img" src={item.img} alt="" />
                            <div className="item-info">
                              <div className="item-name">{item.title}</div>
                              <div className="item-qty">Qté : {item.qt}</div>
                            </div>
                            <div className="item-price">
                              {item.price * item.qt} DH
                            </div>
                          </div>
                        ))}
                      </div>
                    ),
                  )}
                  <div className="modal-total">
                    <span className="total-label">Total</span>
                    <span className="total-amount">
                      {getOrderTotal(selectedTable)} DH
                    </span>
                  </div>
                </>
              ) : (
                <p
                  style={{
                    textAlign: "center",
                    color: "var(--text-4)",
                    padding: "16px 0",
                    fontSize: "0.9rem",
                  }}
                >
                  Aucune commande pour cette table
                </p>
              )}
            </div>

            <div className="modal-footer">
              {!isMine ? (
                <div className="claimed-notice">
                  ⚠️ Table prise en charge par{" "}
                  <strong style={{ marginLeft: 4 }}>
                    {selData?.serverName}
                  </strong>
                </div>
              ) : (
                <>
                  {selStatus === "ordered" && (
                    <>
                      <button
                        className="action-btn btn-confirm"
                        onClick={() => doAction(selectedTable, "confirm")}
                      >
                        ✅ Confirmer la commande
                      </button>
                      <button
                        className="action-btn btn-cancel"
                        onClick={() => doAction(selectedTable, "cancel")}
                      >
                        Annuler
                      </button>
                    </>
                  )}
                  {selStatus === "confirmed" && (
                    <button
                      className="action-btn btn-cancel"
                      onClick={() => doAction(selectedTable, "cancel")}
                    >
                      Annuler la commande
                    </button>
                  )}
                  {selStatus === "ready" && (
                    <button
                      className="action-btn btn-served"
                      onClick={() => doAction(selectedTable, "served")}
                    >
                      🍽️ Marquer comme servie
                    </button>
                  )}
                  {(selStatus === "notPayed" || selStatus === "bill") && (
                    <button
                      className="action-btn btn-paid"
                      onClick={() => doAction(selectedTable, "paid")}
                    >
                      ✔ Confirmer le paiement
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
