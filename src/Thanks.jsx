import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Ticket from "./Ticket";
import Header from "./Header";
import "./Thanks.css";

const TICKET_KEY = "restaurant_last_ticket";

export default function Thanks({ order, setOrder, tableNumber }) {
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // ── Case 1: arriving with a fresh order ──────────────────────────────────
    if (order && Object.keys(order).length > 0) {
      const finalReceipt = {
        table: tableNumber || "Walk-in",
        items: { ...order },
        total: Object.values(order).reduce(
          (acc, item) => acc + item.price * item.quantity,
          0,
        ),
        timestamp: new Date().toLocaleString("en-GB", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      };

      // Persist so the ticket survives navigation / page refresh
      localStorage.setItem(TICKET_KEY, JSON.stringify(finalReceipt));

      setConfirmation(finalReceipt);
      setOrder({});
      setLoading(false);
      return;
    }

    // ── Case 2: returning to /thanks with no active order ────────────────────
    const saved = localStorage.getItem(TICKET_KEY);
    if (saved) {
      try {
        setConfirmation(JSON.parse(saved));
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(TICKET_KEY);
      }
    }

    // ── Case 3: nothing at all — redirect home ───────────────────────────────
    const timer = setTimeout(() => navigate("/home", { replace: true }), 3000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewOrder = () => {
    localStorage.removeItem(TICKET_KEY);
    navigate("/home", { replace: true });
  };

  return (
    <main>
      <Header className="menuHeader" tableNumber={tableNumber} />
      <div className="ticketThanks">
        {loading ? (
          <div className="status-msg">Sending order to kitchen…</div>
        ) : (
          <>
            <div className="thanks-hero">
              <div className="thanks-check-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="thanks-title">Order Confirmed</h2>
              <p className="thanks-subtitle">Your order is on its way to the kitchen</p>
              {confirmation.table && (
                <span className="thanks-table-chip">
                  {isNaN(confirmation.table) ? confirmation.table : `Table ${confirmation.table}`}
                </span>
              )}
            </div>

            <div className="thanks-container">
              <Ticket
                order={confirmation.items}
                table={confirmation.table}
                timestamp={confirmation.timestamp}
                ticketType="thanks"
              />
            </div>

            <button className="thanks-new-order" onClick={handleNewOrder}>
              Place New Order
            </button>
          </>
        )}
      </div>
    </main>
  );
}
