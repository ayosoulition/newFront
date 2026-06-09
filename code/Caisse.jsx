import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import "./Serveur.css";

const API_BASE_URL = "http://localhost:3005";
const socket = io(API_BASE_URL);

export default function Caisse() {
  const { logout, token } = useAuth();
  const [tables, setTables] = useState({});
  const [orders, setOrders] = useState({});
  const [selectedTable, setSelectedTable] = useState(null);
  const prevRef = useRef({});

  // ================= SOCKET =================
  useEffect(() => {
    fetch(`${API_BASE_URL}/tables`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setTables);

    fetch(`${API_BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
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
  }, [token]);

  // ================= API =================
  const updateTable = (id, action) => {
    return fetch(`${API_BASE_URL}/tables/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });
  };

  // ================= ACTION =================
  const markReady = async () => {
    if (!selectedTable) return;

    try {
      console.log("[v0] Marking table ready:", selectedTable, "Token:", token);
      const response = await updateTable(selectedTable, "ready");
      console.log("[v0] Response status:", response.status);

      if (!response.ok) {
        const error = await response.text();
        console.error("[v0] Error response:", error);
        alert(`Error: ${response.status} - ${error}`);
        return;
      }

      console.log("[v0] Table marked as ready successfully");
      setSelectedTable(null);
    } catch (error) {
      console.error("[v0] Error marking table ready:", error);
      alert("Error marking table ready: " + error.message);
    }
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
        <nav className="header-nav">
          <button
            className="nav-link"
            onClick={logout}
            style={{ marginLeft: "auto", background: "#dc3545" }}
          >
            🚪 Logout
          </button>
        </nav>
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

      {/* MODAL */}
      {selectedTable && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Table {selectedTable}</h3>
              <button className="close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {getOrder(selectedTable) ? (
                Object.entries(getOrder(selectedTable)).map(([cat, items]) => (
                  <div key={cat}>
                    <h4>{cat}</h4>

                    {items.map((item) => (
                      <div className="item-card" key={item.id}>
                        <img className="item-img" src={`${item.img}`} alt="" />

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
