// src/contexts/SocketContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io("http://localhost:5000", {
            reconnection: true, // Enable automatic reconnection
            reconnectionAttempts: Infinity, // Keep trying to reconnect
            reconnectionDelay: 1000, // Wait 1s between attempts
        });

        newSocket.on("connect", () => {
            console.log("Socket.IO connected:", newSocket.id);
            toast.success("Connected to server");
        });

        newSocket.on("message", (msg) => {
            console.log("Server message:", msg);
            toast.info(msg);
        });

        newSocket.on("disconnect", () => {
            console.log("Socket.IO disconnected");
            toast.error("Disconnected from server");
        });

        newSocket.on("connect_error", (error) => {
            console.error("Connection error:", error);
            toast.error("Failed to connect to server");
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
            <ToastContainer position="top-right" autoClose={3000} theme="light" />
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);