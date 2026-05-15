import DeploymentItem from "./DeploymentItem";

function DeploymentHistory({ deployments }) {

  if (!deployments.length) {

    return (
      <div className="empty-state">

        <span className="empty-state-icon">
          🚀
        </span>

        <h2>No Deployments Yet</h2>

        <p>
          Deploy your first repository to begin.
        </p>

      </div>
    );
  }

  return (

    <div className="deployment-grid">

      {deployments
        .slice()
        .reverse()
        .map((deployment) => (

          <DeploymentItem
            key={deployment.id}
            deployment={deployment}
          />

      ))}

    </div>

  );
}

export default DeploymentHistory;