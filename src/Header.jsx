import { Link } from "react-router-dom";

import "./Header.css";

const TICKET_KEY = "restaurant_last_ticket";

export default function Header({ tableNumber, className }) {
  const hasTicket = !!localStorage.getItem(TICKET_KEY);

  return (
    <header className={className}>
      <nav>
        <ul>
          <li>
            <Link to="/">
              <span className="headerBtn">
                <i className="bx bxs-home"></i>
              </span>
            </Link>
          </li>

          {tableNumber ? <li>Table Number {tableNumber}</li> : null}

          {/* Ticket link — only shown when a saved ticket exists */}
          {hasTicket && (
            <li>
              <Link to="/thanks">
                <span
                  className="headerBtn headerBtn--ticket"
                  title="View your ticket"
                >
                  <i className="bx bxs-receipt"></i>
                </span>
              </Link>
            </li>
          )}

          <li>
            {/* existing fork/knife SVG icon */}
            <svg
              className="headerBtn"
              version="1.1"
              id="Layer_1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 504 504"
              xmlSpace="preserve"
              fill="#000000"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0" />
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <g id="SVGRepo_iconCarrier">
                <circle style={{ fill: "#324A5E" }} cx="252" cy="252" r="252" />
                <circle
                  style={{ fill: "#FFFFFF" }}
                  cx="252"
                  cy="252"
                  r="104.9"
                />
                <circle
                  style={{ fill: "#E6E9EE" }}
                  cx="252"
                  cy="252"
                  r="59.9"
                />
                <path
                  style={{ fill: "#FFFFFF" }}
                  d="M132.8,211.2l-0.1-49.7c0-2.9-2.3-5.2-5.2-5.2s-5.2,2.3-5.2,5.2v37.6h-10.8v-37.6
          c0-2.9-2.3-5.2-5.2-5.2c-2.9,0-5.2,2.3-5.2,5.2v37.6H90.4v-37.6c0-2.9-2.3-5.2-5.2-5.2c-2.9,0-5.2,2.3-5.2,5.2l0,49.7l16,23.9
          l-2.5,36.6h26.2l-2.5-36.6L132.8,211.2z"
                />
                <path
                  style={{ fill: "#FF7058" }}
                  d="M89.5,329.3c-0.8,9.9,7,18.4,17,18.4s17.8-8.5,17-18.4l-3.9-57.7H93.4L89.5,329.3z"
                />
                <path
                  style={{ fill: "#FFFFFF" }}
                  d="M407.1,232.4c10-6,16.9-20.1,16.9-36.4c0-21.9-12.5-39.6-27.8-39.6s-27.8,17.7-27.8,39.6
          c0,16.5,7.1,30.6,17.2,36.6l-2.5,39.1h26.7L407.1,232.4z"
                />
                <path
                  style={{ fill: "#FF7058" }}
                  d="M383,271.6l-3.6,56.2c-0.8,9.9,7,18.4,17,18.4s17.8-8.5,17-18.4l-3.6-56.2H383z"
                />
              </g>
            </svg>
          </li>
        </ul>
      </nav>
    </header>
  );
}
