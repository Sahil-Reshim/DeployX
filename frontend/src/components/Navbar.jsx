import { useState } from "react";

function Navbar({
  activePage,
  setActivePage
}) {

  const [mobileOpen, setMobileOpen] =
    useState(false);

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
     Prevent unnecessary rerender/poll reset
  ───────────────────────────────────────────── */

  const handleNavigation = (
    pageKey
  ) => {

    // Prevent state update
    // if already on same page

    if (activePage === pageKey) {

      setMobileOpen(false);

      return;

    }

    setActivePage(pageKey);

    setMobileOpen(false);

  };

  return (

    <nav className="navbar">

      {/* LOGO */}

      <div
        className="navbar-logo"
        onClick={() =>
          handleNavigation(
            "dashboard"
          )
        }
      >

        Deploy<span>X</span>

      </div>

      {/* NAV LINKS */}

      <ul
        className={`nav-links ${
          mobileOpen
            ? "mobile-open"
            : ""
        }`}
      >

        {navItems.map((item) => (

          <li
            key={item.key}
            className={`

              ${
                activePage === item.key
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

            <span>
              {item.label}
            </span>

            {item.comingSoon && (

              <span className="coming-soon-badge">

                SOON

              </span>

            )}

          </li>

        ))}

      </ul>

      {/* STATUS */}

      <div className="navbar-status">

        <span className="navbar-status-dot"></span>

        All Systems Operational

      </div>

      {/* MOBILE MENU */}

      <button
        className={`navbar-hamburger ${
          mobileOpen
            ? "active"
            : ""
        }`}
        onClick={() =>
          setMobileOpen(
            (prev) => !prev
          )
        }
        aria-label="Toggle menu"
      >

        <span></span>

        <span></span>

        <span></span>

      </button>

    </nav>

  );
}

export default Navbar;