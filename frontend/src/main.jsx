import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import "./styles/global.css";
import "./styles/common.css";
import "./styles/layout.css";
import "./styles/auth.css";
import "./styles/patient.css";
import "./styles/doctor.css";
import "./styles/admin.css";
import "./styles/navigation.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
