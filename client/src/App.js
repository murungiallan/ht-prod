// src/App.js
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";

function App() {
    return (
        <AuthProvider>
            <SocketProvider>
                <Router>
                    <AppRoutes />
                </Router>
            </SocketProvider>
        </AuthProvider>
    );
}

export default App;