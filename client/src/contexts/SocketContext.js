// SocketContext.js
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";
import { debounce } from "lodash";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const authContext = useContext(AuthContext);
  const { getCachedToken, user } = authContext || {};

  const debouncedToastError = debounce((message) => {
    console.error(message);
  }, 5000);

  const initializeSocket = useCallback(async () => {
    if (!user || !getCachedToken) {
      console.warn("Skipping socket initialization: User or token not available");
      return;
    }

    try {
      const token = await getCachedToken();
      console.log("Connecting with token:", token);
      const newSocket = io("http://127.0.0.1:5000", {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log("Socket.IO connected:", newSocket.id);
      });

      newSocket.on("message", (msg) => {
        console.log("Server message:", msg);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket.IO disconnected:", reason);
        debouncedToastError("Disconnected from server: " + reason);
      });

      newSocket.on("connect_error", async (error) => {
        console.error("Connection error:", error);
        if (error.message.includes("Token expired") || error.message.includes("Invalid token")) {
          try {
            const newToken = await getCachedToken();
            newSocket.auth.token = newToken; // Update token for reconnection
            newSocket.connect();
            console.log("Retrying connection with new token:", newToken);
          } catch (tokenError) {
            debouncedToastError("Failed to refresh token. Please log in again.");
            newSocket.disconnect();
          }
        } else {
          debouncedToastError("Failed to connect to server: " + error.message);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } catch (error) {
      console.error("Error initializing Socket.IO:", error);
      debouncedToastError("Failed to initialize real-time connection");
    }
  }, [user, getCachedToken]);

  useEffect(() => {
    initializeSocket();
  }, [initializeSocket]);

  const getSocket = () => {
    if (!socket) {
      throw new Error("Socket.IO not connected");
    }
    return socket;
  };

  return (
    <SocketContext.Provider value={{ socket, getSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);