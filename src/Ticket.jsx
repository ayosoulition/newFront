import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3005");

export default function Ticket({
  order,
  table,
  children,
  ticketType,
  timestamp,
}) {
  const [tableStatus, setTableStatus] = useState(null);

  let lien = "http://localhost:3005";
  const keys = Object.keys(order || {});

  let total = 0;

  keys.forEach((category) => {
    order[category].forEach((element) => {
      total += element.price * element.qt;
    });
  });

  useEffect(() => {
    socket.on("tables-update", (tablesData) => {
      if (tablesData[table]) {
        setTableStatus(tablesData[table].status);
      }
    });

    return () => {
      socket.off("tables-update");
    };
  }, [table]);
  // 🔥 Listen for real-time table updates
  // 🔥 Initial fetch (important on refresh)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(lien + "/tables");
        const data = await res.json();

        if (data[table]) {
          setTableStatus(data[table].status);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchStatus();
  }, [table]);

  // 🔥 REQUEST BILL
  const requestBill = async () => {
    try {
      await fetch(lien + "/tables/" + table + "/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "bill" }),
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
