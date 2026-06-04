import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./Serveur.css";

const API_BASE_URL = "http://localhost:3005";
const socket = io(API_BASE_URL);

export default function Caisse() {
  const [tables, setTables] = useState({});
  const [orders, setOrders] = useState({});
  const [selectedTable, setSelectedTable] = useState(null);

  const prevRef = useRef({});

  // ================= SOCKET =================
  useEffect(() => {
    fetch(`${API_BASE_URL}/tables`)
      .then((r) => r.json())
      .then(setTables);

    fetch(`${API_BASE_URL}/orders`)
      .then((r) => r.json())
      .then(setOrders);

    socket.on("tables-update", (data) => {
      prevRef.current = data;
      setTables(data);
    });

    socket.on("new-order", (data) => {
      setOrders(data);
    });

    return () => {
      socket.off("tables-update");
      socket.off("new-order");
    };
  }, []);

  // ================= API =================
  const updateTable = (id, action) => {
    return fetch(`${API_BASE_URL}/tables/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  };

  // ================= ACTION =================
  const markReady = async () => {
    if (!selectedTable) return;

    await updateTable(selectedTable, "ready");
    setSelectedTable(null);
  };

  // ================= FILTER =================
  const confirmedTables = Object.keys(tables).filter(
    (id) => tables[id].status === "confirmed",
  );

  const getOrder = (tableId) => {
    return orders[tableId]?.order || null;
  };

  const closeModal = () => setSelectedTable(null);

  // ================= UI =================
  return (
    <div className="dashboard-container">
      <header className="app-header">
        <div className="app-logo">Caisse Interface</div>
      </header>

      <main className="main-content">
        <section className="tables-grid">
          {confirmedTables.map((id) => (
            <div
              key={id}
              className="table-card status-confirmed"
              onClick={() => setSelectedTable(id)}
            >
              <div className="table-card-header">Confirmée</div>
              <div className="table-card-body">
                <div className="table-number">Table {id}</div>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* ================= MODAL (MATCH SERVEUR) ================= */}
      {selectedTable && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            {/* HEADER */}
            <div className="modal-header">
              <h3>Table {selectedTable}</h3>
              <button className="close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="modal-body">
              {/* ORDER LIST */}
              {getOrder(selectedTable) ? (
                Object.entries(getOrder(selectedTable)).map(([cat, items]) => (
                  <div key={cat}>
                    <h4>{cat}</h4>

                    {items.map((item) => (
                      <div className="item-card" key={item.id}>
                        <img
                          className="item-img"
                          src={`assets/${item.img}`}
                          alt=""
                        />

                        <div>
                          <div style={{ fontWeight: 600 }}>{item.title}</div>
                          <div className="small-text">Qty: {item.qt}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p className="small-text">No order found</p>
              )}

              {/* ACTION BUTTON (MATCH STYLE SYSTEM) */}
              <div className="btn-container">
                <button className="btn-ready" onClick={markReady}>
                  🍳 Marquer comme prêt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
