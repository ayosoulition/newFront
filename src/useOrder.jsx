import { useEffect, useState } from "react";

const useOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/orders`);
        if (res.ok) setOrders(await res.json());
      } catch {}
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  return { orders };
};

export default useOrders;
