import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import axios from "axios";

// Always send cookies
axios.defaults.withCredentials = true;
// Use relative base; Vite proxy handles dev, Express handles prod
axios.defaults.baseURL = "";

// ✅ Get Google Client ID from environment variable
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

console.log('🔑 Google Client ID loaded:', googleClientId ? 'Yes' : 'No');
if (!googleClientId) {
  console.error('❌ VITE_GOOGLE_CLIENT_ID is not set in frontend/.env!');
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
