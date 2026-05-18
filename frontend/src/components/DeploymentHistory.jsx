import DeploymentItem from "./DeploymentItem";

function DeploymentHistory({
  deployments = [],
  loading = false,
}) {

  // Loading state

  if (loading) {

    return (

      <div className="empty-state">

        <span className="empty-state-icon">
          ⏳
        </span>

        <h2>Loading Deployments</h2>

        <p>
          Fetching real deployment data from backend...
        </p>

      </div>

    );
  }

  // Empty state

  if (!deployments || deployments.length === 0) {

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

  // Sort latest first using backend created_at

  const sortedDeployments = deployments
    .slice()
    .sort((a, b) => {

      const first =
        new Date(
          b.created_at || 0
        ).getTime();

      const second =
        new Date(
          a.created_at || 0
        ).getTime();

      return first - second;

    });

  return (

    <div className="history-section">

      {/* SECTION HEADER */}

      <div className="section-header">

        <h1>
          Deployment History
        </h1>

        <div className="count-badge">

          {sortedDeployments.length}
          {" "}
          Deployments

        </div>

      </div>

      {/* DEPLOYMENT GRID */}

      <div className="deployment-grid">

        {sortedDeployments.map(
          (deployment) => (

            <DeploymentItem
              key={
                deployment.id
              }
              deployment={
                deployment
              }
            />

          )
        )}

      </div>

    </div>

  );
}

export default DeploymentHistory;