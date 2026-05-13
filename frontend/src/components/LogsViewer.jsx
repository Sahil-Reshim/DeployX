function LogsViewer() {
  return (
    <div className="logs-container">
      <h3>Deployment Logs</h3>

      <div className="logs-box">
        <p>Cloning repository...</p>
        <p>Building Docker container...</p>
        <p>Starting deployment...</p>
        <p>Deployment successful 🚀</p>
      </div>
    </div>
  );
}

export default LogsViewer;