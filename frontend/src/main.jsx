import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./styles/dashboard.css";
import "./styles/navbar.css";
import "./styles/deployment.css";
import "./styles/logs.css";
import "./styles/animations.css";
import "./styles/monitoring.css";
import "./styles/charts.css";
import "./styles/health.css";
import "./styles/metrics.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);