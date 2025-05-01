// src/App.js
import React from 'react';
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from 'styled-components';
import { theme } from './components/MedicationTracker/styles';
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
    return (
        <AuthProvider>
            <SocketProvider>
                <ThemeProvider theme={theme}>
                    <Router>
                        <div className="App">
                            <AppRoutes />
                            <ToastContainer position="top-right" autoClose={3000} />
                        </div>
                    </Router>
                </ThemeProvider>
            </SocketProvider>
        </AuthProvider>
    );
}

export default App;