// src/App.js
import React from 'react';
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from 'styled-components';
import { theme } from './components/MedicationTracker/styles';
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from 'react-hot-toast';
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
                            <Toaster
                                position="top-right"
                                reverseOrder={false}
                                gutter={8}
                                containerClassName=""
                                containerStyle={{}}
                                toastOptions={{
                                    className: '',
                                    duration: 5000,
                                    removeDelay: 1000,
                                    style: {
                                    background: 'amber',
                                    color: '#363636',
                                    },
                                }}
                            />
                        </div>
                    </Router>
                </ThemeProvider>
            </SocketProvider>
        </AuthProvider>
    );
}

export default App;