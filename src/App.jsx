import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useParams,
  useNavigate,
  Navigate,
} from "react-router-dom";

// Components
import Home from "./Home.jsx";
import Book from "./Book.jsx";
import Order from "./Order.jsx";
import Thanks from "./Thanks.jsx";
import Login from "./Login.jsx";
import Serveur from "./Serveur.jsx";
import Register from "./Register.jsx";
import Admin from "./Admin.jsx";
import Caisse from "./Caisse.jsx";

const API_BASE_URL = "http://localhost:3005";

// ================= TABLE INIT =================
function TableInitializer({ setTableNumber }) {
  const { tableNumber } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (tableNumber && tableNumber !== "0") {
      setTableNumber(tableNumber);
      localStorage.setItem("tableNumber", tableNumber);
    } else {
      setTableNumber(null);
      localStorage.removeItem("tableNumber");
    }

    navigate("/home", { replace: true });
  }, [tableNumber]);

  return <div>Loading...</div>;
}

export default function App() {
  const [tableNumber, setTableNumber] = useState(
    localStorage.getItem("tableNumber"),
  );

  const [order, setOrder] = useState({});
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);

  // ================= FETCH MENU =================
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/menu`);
        const data = await res.json();
        setMenu(data);
      } catch (err) {
        console.error("Menu error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  if (loading) return <div>Loading menu...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/table/:tableNumber"
          element={<TableInitializer setTableNumber={setTableNumber} />}
        />

        <Route path="/" element={<Navigate to="/home" />} />

        {/* HOME */}
        <Route
          path="/home"
          element={
            <Home tableNumber={tableNumber} categories={Object.keys(menu)} />
          }
        />

        {/* MENU ROUTES */}
        {Object.keys(menu).map((cat) => (
          <Route
            key={cat}
            path={`/${cat}`}
            element={
              <Book
                tableNumber={tableNumber}
                data={menu[cat]}
                order={order}
                setOrder={setOrder}
                bookType="menu"
              />
            }
          />
        ))}

        {/* ORDER */}
        <Route
          path="/order"
          element={
            <Order
              order={order}
              tableNumber={tableNumber}
              setOrder={setOrder}
            />
          }
        />

        {/* THANKS */}
        <Route
          path="/thanks"
          element={
            <Thanks
              tableNumber={tableNumber}
              setOrder={setOrder}
              order={order}
            />
          }
        />

        {/* ADMIN */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/caisse" element={<Caisse />} />
        <Route path="/serveur" element={<Serveur />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}
