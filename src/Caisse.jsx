import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";
import "./Serveur.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const getTotal = (orderObj) => {
  if (!orderObj) return 0;
  return Object.values(orderObj).reduce(
    (s, items) => s + items.reduce((a, i) => a + i.price * i.qt, 0),
    0,
  );
};

const getItemCount = (orderObj) => {
  if (!orderObj) return 0;
  return Object.values(orderObj).reduce(
    (s, items) => s + items.reduce((a, i) => a + i.qt, 0),
    0,
  );
};

export default function Caisse() {
  const { logout, token } = useAuth();

  const [tables, setTables] = useState({});
  const [orders, setOrders] = useState({});
  const [selectedTable, setSelectedTable] = useState(null);

  // ── Polling ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [tablesData, ordersData] = await Promise.all([
          fetch(`${API_BASE_URL}/tables`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          fetch(`${API_BASE_URL}/orders`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
        ]);
        setTables(tablesData);
        setOrders(ordersData);
      } catch {
        toast.error("Erreur de chargement", { position: "top-right" });
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [token]);

  // ── Mark ready ──────────────────────────────────────────────────────────
  const markReady = async () => {
    if (!selectedTable) return;
    const tableId = selectedTable;
    setSelectedTable(null);

    try {
      const res = await fetch(`${API_BASE_URL}/tables/${tableId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "ready" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error || `Erreur ${res.status}`, {
          position: "top-right",
        });
        return;
      }

      toast.success(`🍳 Table ${tableId} — commande prête`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch {
      toast.error("Erreur réseau", { position: "top-right" });
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────
  const confirmedTables = Object.keys(tables).filter(
    (id) => tables[id].status === "confirmed",
  );
  const selectedOrder = orders[selectedTable]?.order ?? null;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-logo">
          🍳
          <span>Cuisine</span>
          <span className="header-role">Caisse</span>
        </div>
        {confirmedTables.length > 0 && (
          <div className="header-user">
            <span
              style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}
            >
              {confirmedTables.length} commande
              {confirmedTables.length > 1 ? "s" : ""} en attente
            </span>
          </div>
        )}
        <button className="header-logout" onClick={logout}>
          Déconnexion
        </button>
      </header>

      <main className="main-content">
        <section className="tables-grid">
          {confirmedTables.length === 0 ? (
            <div className="caisse-empty">
              <div className="caisse-empty-icon">🍽️</div>
              <p>Aucune commande en attente</p>
              <small>Les nouvelles commandes confirmées apparaîtront ici</small>
            </div>
          ) : (
            confirmedTables.map((id) => {
              const t = tables[id];
              const count = getItemCount(orders[id]?.order);
              return (
                <div
                  key={id}
                  className="table-card status-confirmed"
                  onClick={() => setSelectedTable(id)}
                >
                  <div className="table-card-header">
                    <span>Confirmée</span>
                    {t.serverName && (
                      <span className="card-server-badge">{t.serverName}</span>
                    )}
                  </div>
                  <div className="table-card-body">
                    <span className="table-label">Table</span>
                    <span className="table-number">{id}</span>
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
                <div className="modal-status" style={{ background: "#2563eb" }}>
                  Confirmée
                </div>
                {tables[selectedTable]?.serverName && (
                  <div className="modal-server-info">
                    👤 {tables[selectedTable].serverName}
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
              {selectedOrder ? (
                <>
                  {Object.entries(selectedOrder).map(([cat, items]) => (
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
                  ))}
                  <div className="modal-total">
                    <span className="total-label">Total</span>
                    <span className="total-amount">
                      {getTotal(selectedOrder)} DH
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
                  Aucun détail de commande
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button className="action-btn btn-kitchen" onClick={markReady}>
                🍳 Marquer comme prêt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
