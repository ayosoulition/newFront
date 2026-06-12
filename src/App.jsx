import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./ProtectedRoute";
import { AuthProvider, useAuth } from "./AuthContext";
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

const API_BASE_URL = import.meta.env.VITE_API_URL;

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

  return <div>Chargement…</div>;
}

// ================= INNER APP COMPONENT =================
function AppContent() {
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

  if (loading) return <div>Chargement du menu…</div>;

  return (
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
          <Order order={order} tableNumber={tableNumber} setOrder={setOrder} />
        }
      />

      {/* THANKS */}
      <Route
        path="/thanks"
        element={
          <Thanks tableNumber={tableNumber} setOrder={setOrder} order={order} />
        }
      />

      {/* PROTECTED ADMIN ROUTES */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <Admin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/serveur"
        element={
          <ProtectedRoute role="serveur">
            <Serveur />
          </ProtectedRoute>
        }
      />

      <Route
        path="/caisse"
        element={
          <ProtectedRoute role="caisse">
            <Caisse />
          </ProtectedRoute>
        }
      />

      {/* AUTH */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

// ================= MAIN APP WITH PROVIDER =================
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}
