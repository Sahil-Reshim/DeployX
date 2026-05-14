import { useState } from "react";

function Navbar({ activePage, setActivePage }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", key: "dashboard" },
    { label: "Deployments", key: "deployments" },
    { label: "Logs", key: "logs" },
    { label: "Monitoring", key: "monitoring", comingSoon: true },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => setActivePage("dashboard")}>
        Deploy<span>X</span>
      </div>

      <ul className={`nav-links ${mobileOpen ? "mobile-open" : ""}`}>
        {navItems.map((item) => (
          <li
            key={item.key}
            className={`
              ${activePage === item.key ? "active" : ""}
              ${item.comingSoon ? "nav-coming-soon" : ""}
            `}
            onClick={() => {
              setActivePage(item.key);
              setMobileOpen(false);
            }}
          >
            {item.label}
            {item.comingSoon && (
              <span className="coming-soon-badge">SOON</span>
            )}
          </li>
        ))}
      </ul>

      <div className="navbar-status">
        <span className="navbar-status-dot"></span>
        All Systems Operational
      </div>

      <button
        className="navbar-hamburger"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <span></span><span></span><span></span>
      </button>
    </nav>
  );
}

export default Navbar;