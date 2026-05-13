function DeployCard({ status, project }) {
  return (
    <div className="deploy-card">
      <h2>{project}</h2>

      <div className="status">
        Status:
        <span>{status}</span>
      </div>

      <div className="live-dot"></div>
    </div>
  );
}

export default DeployCard;