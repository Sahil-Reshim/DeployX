import { useMemo } from "react";
import DeploymentItem from "./DeploymentItem";

function DeploymentHistory({
  deployments = [],
  loading = false,
  onDeleteDeployment,
  onRefresh,
}) {

  /*
    SORT DEPLOYMENTS
  */

  const sortedDeployments = useMemo(() => {

    return [...deployments].sort((a, b) => {

      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );

    });

  }, [deployments]);

  /*
    STATS
  */

  const totalDeployments = sortedDeployments.length;

  const successfulDeployments =
    sortedDeployments.filter((deployment) => {

      const status =
        (deployment.status || "").toLowerCase();

      return [
        "running",
        "success",
        "live",
        "completed",
      ].includes(status);

    }).length;

  const failedDeployments =
    sortedDeployments.filter((deployment) => {

      return (
        deployment.status?.toLowerCase() ===
        "failed"
      );

    }).length;

  /*
    DELETE
  */

  const handleDelete = (deploymentId) => {

    if (!deploymentId) {

      alert("Deployment ID missing");
      return;

    }

    const confirmed =
      window.confirm(
        "Delete this deployment permanently?"
      );

    if (!confirmed) return;

    if (onDeleteDeployment) {

      onDeleteDeployment(deploymentId);

    }

  };

  /*
    LOADING
  */

  if (loading) {

    return (

      <div className="history-loading">

        <div className="history-loader"></div>

        <h2>Loading Deployments</h2>

        <p>
          Fetching deployment history...
        </p>

      </div>

    );

  }

  /*
    EMPTY
  */

  if (!deployments.length) {

    return (

      <div className="history-empty">

        <div className="history-empty-icon">
          🚀
        </div>

        <h2>No Deployments Yet</h2>

        <p>
          Deploy your first repository
          to start runtime history.
        </p>

      </div>

    );

  }

  /*
    MAIN UI
  */

  return (

    <div className="deployment-history">

      {/* HEADER */}

      <div className="deployment-history-header">

        <div>

          <div className="history-mini-badge">
            DEPLOYX RUNTIME
          </div>

          <h2>
            Deployment History
          </h2>

          <p>
            Monitor and manage
            all deployments.
          </p>

        </div>

        <div className="deployment-history-right">

          <div className="history-stat-card">
            <span>Total</span>
            <strong>{totalDeployments}</strong>
          </div>

          <div className="history-stat-card success">
            <span>Live</span>
            <strong>{successfulDeployments}</strong>
          </div>

          <div className="history-stat-card failed">
            <span>Failed</span>
            <strong>{failedDeployments}</strong>
          </div>

        </div>

      </div>

      {/* ACTIONS */}

      <div className="history-actions">

        <div className="history-live-indicator">

          <span className="history-live-dot"></span>

          Live Sync Enabled

        </div>

        <button
          className="history-refresh-btn"
          onClick={onRefresh}
        >

          Refresh

        </button>

      </div>

      {/* GRID */}

      <div className="deployment-grid">

        {sortedDeployments.map(
          (deployment, index) => {

            const isFailed =
              deployment.status?.toLowerCase() ===
              "failed";

            return (

              <div
                key={
                  deployment.id ||
                  index
                }
                className="deployment-grid-item"
              >

                {/* DELETE BUTTON */}

                <button
                  className="deployment-delete-btn"
                  onClick={() =>
                    handleDelete(
                      deployment.id
                    )
                  }
                  title="Delete Deployment"
                >

                  ✕

                </button>

                {/* FAILED TAG */}

                {isFailed && (

                  <div className="failed-badge">

                    FAILED

                  </div>

                )}

                {/* CARD */}

                <DeploymentItem
                  deployment={deployment}
                />

              </div>

            );

          }
        )}

      </div>

    </div>

  );

}

export default DeploymentHistory;