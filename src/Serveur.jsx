import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./Serveur.css";

const API_BASE_URL = "http://localhost:3005";
const socket = io(API_BASE_URL);

export default function Serveur() {
  const [tables, setTables] = useState({});
  const [selectedTable, setSelectedTable] = useState(null);
  const [orders, setOrders] = useState({});

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTable, setSearchTable] = useState("");

  const notificationSoundRef = useRef(null);
  const prevTablesRef = useRef({});

  // ================= SOUND =================
  useEffect(() => {
    const sound = new Audio("/assets/notif.wav");
    sound.preload = "auto";
    sound.load();
    notificationSoundRef.current = sound;

    const unlockAudio = () => {
      const s = notificationSoundRef.current;
      if (!s) return;

      s.play()
        .then(() => {
          s.pause();
          s.currentTime = 0;
        })
        .catch(() => {});
    };

    window.addEventListener("click", unlockAudio, { once: true });

    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  const playSound = () => {
    const sound = notificationSoundRef.current;
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  };

  // ================= SOCKET =================
  useEffect(() => {
    fetch(`${API_BASE_URL}/orders`)
      .then((res) => res.json())
      .then(setOrders);

    fetch(`${API_BASE_URL}/tables`)
      .then((res) => res.json())
      .then(setTables);

    socket.on("tables-update", (newTables) => {
      const prevTables = prevTablesRef.current;

      const importantStatuses = new Set(["ordered", "bill", "ready"]);
      let shouldPlaySound = false;

      for (const tableId in newTables) {
        const next = newTables[tableId];
        const prev = prevTables?.[tableId];

        if (!prev) continue;

        if (prev.status !== next.status && importantStatuses.has(next.status)) {
          shouldPlaySound = true;
          break;
        }
      }

      if (shouldPlaySound) playSound();

      prevTablesRef.current = JSON.parse(JSON.stringify(newTables));
      setTables(newTables);
    });

    socket.on("new-order", (data) => {
      setOrders(data);
      playSound();
    });

    socket.on("order-ready", (data) => {
      const tableId = data.tableId;

      playSound();

      setTables((prev) => ({
        ...prev,
        [tableId]: {
          ...prev[tableId],
          status: "ready",
        },
      }));
    });

    return () => {
      socket.off("tables-update");
      socket.off("new-order");
      socket.off("order-ready");
    };
  }, []);

  // ================= API =================
  const updateTableStatus = async (tableId, action) => {
    return fetch(`${API_BASE_URL}/tables/${tableId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  };

  // ================= ACTIONS =================
  const handleActionAndClose = async (action) => {
    if (!selectedTable) return;

    try {
      await updateTableStatus(selectedTable, action);

      setTables((prev) => ({
        ...prev,
        [selectedTable]: {
          ...prev[selectedTable],
          status:
            action === "confirm"
              ? "confirmed"
              : action === "served"
                ? "notPayed"
                : action === "paid"
                  ? "empty"
                  : prev[selectedTable]?.status,
        },
      }));

      if (action === "paid") {
        handleCancel(selectedTable);
      }

      setSelectedTable(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (tableId) => {
    try {
      await updateTableStatus(tableId, "cancel");

      setOrders((prev) => {
        const copy = { ...prev };
        delete copy[tableId];
        return copy;
      });

      setTables((prev) => ({
        ...prev,
        [tableId]: { ...prev[tableId], status: "empty" },
      }));

      setSelectedTable(null);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= LABELS =================
  const getStatusLabel = (status) => {
    const labels = {
      empty: "Libre",
      ordered: "Commande",
      confirmed: "Confirmée",
      ready: "Prête 🍳",
      notPayed: "Non payée",
      bill: "Addition",
    };
    return labels[status] || status;
  };

  const closeModal = () => setSelectedTable(null);

  const selectedStatus = tables[selectedTable]?.status;

  // ================= FILTER =================
  const filteredTables = Object.keys(tables).filter((tableId) => {
    const table = tables[tableId];

    const matchStatus =
      table.status === "empty"
        ? false
        : statusFilter === "all" || table.status === statusFilter;

    const matchSearch = tableId.toString().includes(searchTable.trim());

    return matchStatus && matchSearch;
  });

  // ================= UI =================
  return (
    <div className="dashboard-container">
      <header className="app-header">
        <div className="app-logo">Serveur Interface</div>

        <nav className="header-nav">
          <button className="nav-link active">🍽️ Tables</button>
          <button className="nav-link">📋 Commandes</button>
          <button className="nav-link">📜 Historique</button>
        </nav>
      </header>

      <main className="main-content">
        {/* FILTER */}
        <div className="filter-bar">
          <input
            className="search-input"
            type="text"
            placeholder="🔢 Table number..."
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
          />

          <div className="filter-buttons">
            <button
              className={`btn ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All
            </button>

            <button
              className={`btn ${statusFilter === "ordered" ? "active" : ""}`}
              onClick={() => setStatusFilter("ordered")}
            >
              Commande
            </button>

            <button
              className={`btn ${statusFilter === "confirmed" ? "active" : ""}`}
              onClick={() => setStatusFilter("confirmed")}
            >
              Confirmée
            </button>

            <button
              className={`btn ${statusFilter === "ready" ? "active" : ""}`}
              onClick={() => setStatusFilter("ready")}
            >
              Prête 🍳
            </button>

            <button
              className={`btn ${statusFilter === "notPayed" ? "active" : ""}`}
              onClick={() => setStatusFilter("notPayed")}
            >
              Non payée
            </button>
          </div>
        </div>

        {/* TABLES */}
        <section className="tables-grid">
          {filteredTables.map((table) => (
            <div
              key={table}
              onClick={() => setSelectedTable(table)}
              className={`table-card status-${tables[table].status}`}
            >
              <div className="table-card-header">
                {getStatusLabel(tables[table].status)}
              </div>
              <div className="table-card-body">
                <div className="table-number">{table}</div>
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
              {orders[selectedTable]?.order ? (
                Object.entries(orders[selectedTable].order).map(
                  ([cat, items]) => (
                    <div key={cat}>
                      <h4>{cat}</h4>

                      {items.map((item) => (
                        <div key={item.id} className="item-card">
                          <img
                            className="item-img"
                            src={`assets/${item.img}`}
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>{item.title}</div>
                            <div className="small-text">Qty: {item.qt}</div>
                            <div className="small-text">{item.price} DH</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                )
              ) : (
                <p className="small-text">No order for this table</p>
              )}

              <div className="btn-container">
                {selectedStatus === "ordered" && (
                  <>
                    <button
                      className="confirm-btn"
                      onClick={() => handleActionAndClose("confirm")}
                    >
                      Confirm
                    </button>

                    <button
                      className="cancel-btn"
                      onClick={() => handleCancel(selectedTable)}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {selectedStatus === "ready" && (
                  <button
                    className="served-btn"
                    onClick={() => handleActionAndClose("served")}
                  >
                    Served 🍽️
                  </button>
                )}

                {(selectedStatus === "bill" ||
                  selectedStatus === "notPayed") && (
                  <button
                    className="paid-btn"
                    onClick={() => handleActionAndClose("paid")}
                  >
                    Paid ✔
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
