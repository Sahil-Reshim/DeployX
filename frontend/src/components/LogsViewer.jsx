function LogsViewer() {

  return (

    <div className="logs-container">

      <h2>Deployment Logs</h2>

      <div className="logs-box">

        <p>[INFO] Cloning Repository...</p>

        <p>[INFO] Building Docker Container...</p>

        <p>[INFO] Starting Deployment...</p>

        <p>[SUCCESS] Deployment Live 🚀</p>

      </div>

    </div>
  );
}

export default LogsViewer;