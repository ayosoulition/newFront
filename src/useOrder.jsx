import { useEffect, useState } from "react";
import io from "socket.io-client";

const useOrders = () => {
  const [socket, setSocket] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(import.meta.env.VITE_API_URL, {
      transports: ["polling", "websocket"],
    });

    setSocket(socketInstance);

    // Listen for events
    socketInstance.on("orders", (data) => {
      setOrders(data);
    });

    socketInstance.on("newOrder", (newOrder) => {
      console.log("New order received:", newOrder);
      setOrders(newOrder);
    });

    // Cleanup on unmount
    return () => {
      socketInstance.off("orders");
      socketInstance.off("newOrder");
      socketInstance.close();
    };
  }, []);

  return { socket, orders };
};

export default useOrders;
