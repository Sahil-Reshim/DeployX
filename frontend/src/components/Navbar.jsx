import { useState, useCallback } from "react";
import { LayoutDashboard, Rocket, ScrollText, Activity, BarChart3, Settings as SettingsIcon } from "lucide-react";

function Navbar({ activePage, setActivePage }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", key: "dashboard", icon: <LayoutDashboard size={15} /> },
    { label: "Deployments", key: "deployments", icon: <Rocket size={15} /> },
    { label: "Logs", key: "logs", icon: <ScrollText size={15} /> },
    { label: "Monitoring", key: "monitoring", icon: <Activity size={15} /> },
    { label: "Analytics", key: "analytics", icon: <BarChart3 size={15} /> },
    { label: "Settings", key: "settings", icon: <SettingsIcon size={15} /> },
  ];

  const handleNavigation = useCallback(
    (pageKey) => {
      if (activePage === pageKey) {
        setMobileOpen(false);
        return;
      }
      setActivePage(pageKey);
      setMobileOpen(false);
    },
    [activePage, setActivePage]
  );

  const toggleMobileMenu = () => setMobileOpen((prev) => !prev);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="navbar-logo" onClick={() => handleNavigation("dashboard")}>
          <span className="app-logo">
            <span className="app-logo-badge">
              <img src="/logo.png" alt="DeployX" className="app-logo-img" />
            </span>
            <span className="app-logo-text">Deploy<span>X</span></span>
          </span>
        </div>
      </div>

      <div className={`navbar-center ${mobileOpen ? "mobile-open" : ""}`}>
        <ul className="nav-links">
          {navItems.map((item) => {
            const isActive = activePage === item.key;
            return (
              <li
                key={item.key}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleNavigation(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {isActive && <div className="nav-active-indicator"></div>}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="navbar-right">
        <div className="navbar-status">
          <span className="navbar-status-dot"></span>
          <span className="navbar-status-text">SYSTEM ONLINE</span>
        </div>
        <button
          className={`navbar-hamburger ${mobileOpen ? "active" : ""}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
