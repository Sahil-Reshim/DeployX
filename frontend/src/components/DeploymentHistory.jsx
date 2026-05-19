import DeploymentItem from "./DeploymentItem";

function DeploymentHistory({
  deployments = [],
  loading = false,
}) {

  /*
    LOADING
  */

  if (loading) {

    return (

      <div className="empty-state">

        <span className="empty-state-icon">
          ⏳
        </span>

        <h2>
          Loading Deployments
        </h2>

        <p>
          Fetching real deployment data from backend...
        </p>

      </div>

    );
  }

  /*
    EMPTY
  */

  if (
    !deployments ||
    deployments.length === 0
  ) {

    return (

      <div className="empty-state">

        <span className="empty-state-icon">
          🚀
        </span>

        <h2>
          No Deployments Yet
        </h2>

        <p>
          Deploy your first repository to begin.
        </p>

      </div>

    );
  }

  /*
    SORT LATEST FIRST
  */

  const sortedDeployments =
    deployments
      .slice()
      .sort((a, b) => {

        return (
          new Date(
            b.created_at || 0
          ).getTime() -
          new Date(
            a.created_at || 0
          ).getTime()
        );

      });

  return (

    <div className="deployment-grid">

      {sortedDeployments.map(
        (deployment) => (

          <DeploymentItem
            key={deployment.id}
            deployment={deployment}
          />

        )
      )}

    </div>

  );
}

export default DeploymentHistory;