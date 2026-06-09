import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_BASE_URL = "http://localhost:3005";

export default function Ticket({
  order,
  table,
  children,
  ticketType,
  timestamp,
}) {
  const [tableStatus, setTableStatus] = useState(null);
  const socketRef = useRef(null);

  const keys = Object.keys(order || {});

  let total = 0;
  keys.forEach((category) => {
    order[category].forEach((element) => {
      total += element.price * element.qt;
    });
  });

  useEffect(() => {
    if (!table) return;

    // Fetch initial status
    fetch(`${API_BASE_URL}/tables`)
      .then((r) => r.json())
      .then((data) => { if (data[table]) setTableStatus(data[table].status); })
      .catch(() => {});

    // Listen for real-time updates
    const socket = io(API_BASE_URL);
    socketRef.current = socket;
    socket.on("tables-update", (tablesData) => {
      if (tablesData[table]) setTableStatus(tablesData[table].status);
    });

    return () => socket.disconnect();
  }, [table]);

  const requestBill = async () => {
    try {
      await fetch(`${API_BASE_URL}/tables/${table}/bill`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {keys.length !== 0 ? (
        <>
          {/* ================= HEADER ================= */}
          {ticketType === "menu" ? (
            <h1>
              Your <span className="mainColor">Order</span>
            </h1>
          ) : ticketType === "order" ? (
            <h1>
              Confirm <span className="mainColor">Order</span>
            </h1>
          ) : (
            <>
              <h1>
                Your <span className="mainColor">Ticket</span> Order
              </h1>

              <p className="thanksText">
                Thanks for your order! Here is your ticket. We will serve you as
                soon as possible.
              </p>

              <p>{timestamp}</p>
            </>
          )}

          {/* ================= ITEMS ================= */}
          {keys.map((category) => (
            <div className="ticket" key={category}>
              <h2>{category}</h2>

              {order[category].map((element) => (
                <p className="item" key={element.id}>
                  {element.title}
                  <span className="itemQt">x {element.qt}</span>
                </p>
              ))}
            </div>
          ))}

          {/* ================= TOTAL ================= */}
          <div className="total">
            <hr />
            <div className="price">
              Total: <span className="mainColor">{total} DH</span>
            </div>
          </div>

          {/* ================= PAY BUTTON ================= */}
          {ticketType !== "menu" && ticketType !== "order" && (
            <div className="pay">
              <p>Clicker ici lorsque vous etes pret a payer!!</p>
              <button
                className="payBtn"
                onClick={requestBill}
                disabled={tableStatus !== "notPayed"}
              >
                Pay / Addition
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="browse">
          <h1>
            Your <span className="mainColor">Order</span>
          </h1>

          {children}
        </div>
      )}
    </>
  );
}
