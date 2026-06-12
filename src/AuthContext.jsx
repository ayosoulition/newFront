import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ================= VERIFY TOKEN ON MOUNT =================
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setToken(storedToken);
        } else {
          // Token is invalid, clear it
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("username");
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error("Token verification failed:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("username");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // ================= LOGIN =================
  const login = async (username, password) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return { success: false, error: data.error || "Login failed" };
      }

      // Save to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", username);

      // Update state
      setToken(data.token);
      setUser({
        id: data.id,
        username,
        role: data.role,
      });

      setLoading(false);
      return { success: true, role: data.role };
    } catch (err) {
      const errorMsg = "Server error. Try again.";
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
