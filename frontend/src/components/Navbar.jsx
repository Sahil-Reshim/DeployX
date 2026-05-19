import { useState, useCallback } from "react";

function Navbar({
  activePage,
  setActivePage
}) {

  const [mobileOpen, setMobileOpen] =
    useState(false);

  /* ─────────────────────────────────────────────
     NAVIGATION ITEMS
  ───────────────────────────────────────────── */

  const navItems = [

    {
      label: "Dashboard",
      key: "dashboard"
    },

    {
      label: "Deployments",
      key: "deployments"
    },

    {
      label: "Logs",
      key: "logs"
    },

    {
      label: "Monitoring",
      key: "monitoring",
      comingSoon: true
    }

  ];

  /* ─────────────────────────────────────────────
     HANDLE NAVIGATION
     IMPORTANT:
     Only changes page UI.
     Deployment polling continues in Dashboard.
  ───────────────────────────────────────────── */

  const handleNavigation =
    useCallback((pageKey) => {

      // Prevent unnecessary rerender

      if (activePage === pageKey) {

        setMobileOpen(false);

        return;

      }

      // Change page only

      setActivePage(pageKey);

      // Close mobile menu

      setMobileOpen(false);

    }, [
      activePage,
      setActivePage
    ]);

  /* ─────────────────────────────────────────────
     MOBILE TOGGLE
  ───────────────────────────────────────────── */

  const toggleMobileMenu = () => {

    setMobileOpen(
      (prev) => !prev
    );

  };

  return (

    <nav className="navbar">

      {/* LEFT */}

      <div className="navbar-left">

        {/* LOGO */}

        <div
          className="navbar-logo"
          onClick={() =>
            handleNavigation(
              "dashboard"
            )
          }
        >

          <span className="logo-text">

            Deploy<span>X</span>

          </span>

        </div>

      </div>

      {/* CENTER */}

      <div
        className={`navbar-center ${
          mobileOpen
            ? "mobile-open"
            : ""
        }`}
      >

        <ul className="nav-links">

          {navItems.map((item) => {

            const isActive =
              activePage === item.key;

            return (

              <li
                key={item.key}
                className={`nav-item

                  ${
                    isActive
                      ? "active"
                      : ""
                  }

                  ${
                    item.comingSoon
                      ? "nav-coming-soon"
                      : ""
                  }

                `}
                onClick={() =>
                  handleNavigation(
                    item.key
                  )
                }
              >

                <span className="nav-label">

                  {item.label}

                </span>

                {item.comingSoon && (

                  <span className="coming-soon-badge">

                    SOON

                  </span>

                )}

                {isActive && (

                  <div className="nav-active-glow"></div>

                )}

              </li>

            );

          })}

        </ul>

      </div>

      {/* RIGHT */}

      <div className="navbar-right">

        {/* STATUS */}

        <div className="navbar-status">

          <span className="navbar-status-dot"></span>

          <span>
            All Systems Operational
          </span>

        </div>

        {/* MOBILE MENU */}

        <button
          className={`navbar-hamburger ${
            mobileOpen
              ? "active"
              : ""
          }`}
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