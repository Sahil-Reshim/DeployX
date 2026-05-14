import DeploymentItem from "./DeploymentItem";
import EmptyState from "./EmptyState";

function DeploymentHistory({ deployments }) {
  const running = deployments.filter((d) => d.status === "running").length;

  return (
    <div className="history-section">
      <div className="section-header">
        <h1>Live Deployments</h1>
        <span className="count-badge">{running} Running</span>
      </div>

      {deployments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="deployment-grid">
          {deployments.map((deployment, i) => (
            <DeploymentItem
              key={deployment.id || i}
              deployment={deployment}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DeploymentHistory;