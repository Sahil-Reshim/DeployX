function Navbar() {
  return (
    <nav className="navbar">

      <div className="logo">
        Deploy<span>X</span>
      </div>

      <ul className="nav-links">
        <li>Dashboard</li>
        <li>Deployments</li>
        <li>Logs</li>
        <li>Monitoring</li>
      </ul>

    </nav>
  );
}

export default Navbar;