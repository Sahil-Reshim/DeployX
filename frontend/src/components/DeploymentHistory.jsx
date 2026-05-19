import { useMemo } from "react";

import DeploymentItem from "./DeploymentItem";

function DeploymentHistory({
  deployments = [],
  loading = false,
  onDeleteDeployment,
  onClearHistory,
}) {

  /*
    SORT DEPLOYMENTS
  */

  const sortedDeployments =
    useMemo(() => {

      return deployments
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

    }, [deployments]);

  /*
    STATS
  */

  const totalDeployments =
    sortedDeployments.length;

  const successfulDeployments =
    sortedDeployments.filter(
      (deployment) => {

        const status =
          (
            deployment.status ||
            ""
          ).toLowerCase();

        return [

          "running",

          "success",

          "live",

          "completed",

        ].includes(status);

      }
    ).length;

  const failedDeployments =
    sortedDeployments.filter(
      (deployment) => {

        return (
          deployment.status
            ?.toLowerCase() ===
          "failed"
        );

      }
    ).length;

  const activeDeployments =
    sortedDeployments.filter(
      (deployment) => {

        return [

          "queued",

          "cloning",

          "detecting",

          "dockerfile_generating",

          "building",

          "deploying",

        ].includes(
          deployment.status?.toLowerCase()
        );

      }
    ).length;

  /*
    DELETE ALL
  */

  const handleClearHistory = () => {

    const confirmed =
      window.confirm(
        "Delete all deployment history?"
      );

    if (
      confirmed &&
      onClearHistory
    ) {

      onClearHistory();

    }
  };

  /*
    LOADING STATE
  */

  if (loading) {

    return (

      <div className="deployment-history">

        <div className="history-loading">

          <div className="history-loading-glow"></div>

          <div className="history-loader"></div>

          <h2>
            Loading Deployments
          </h2>

          <p>

            Fetching live deployment
            infrastructure data from
            backend runtime engine...

          </p>

        </div>

      </div>

    );
  }

  /*
    EMPTY STATE
  */

  if (
    !deployments ||
    deployments.length === 0
  ) {

    return (

      <div className="deployment-history">

        <div className="history-empty">

          <div className="history-empty-grid"></div>

          <div className="history-empty-glow"></div>

          <div className="history-empty-icon">

            🚀

          </div>

          <h2>
            No Deployments Yet
          </h2>

          <p>

            Start your first deployment
            to launch real-time CI/CD
            infrastructure with DeployX.

          </p>

        </div>

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

        <div className="deployment-history-left">

          <div className="history-mini-badge">

            DEPLOYX RUNTIME

          </div>

          <h2>
            Deployment History
          </h2>

          <p>

            Monitor and manage your
            production deployments
            in real-time.

          </p>

        </div>

        <div className="deployment-history-right">

          <div className="history-stat-card">

            <span className="stat-label">

              Total

            </span>

            <strong className="stat-value">

              {totalDeployments}

            </strong>

          </div>

          <div className="history-stat-card success">

            <span className="stat-label">

              Live

            </span>

            <strong className="stat-value">

              {successfulDeployments}

            </strong>

          </div>

          <div className="history-stat-card active">

            <span className="stat-label">

              Active

            </span>

            <strong className="stat-value">

              {activeDeployments}

            </strong>

          </div>

          <div className="history-stat-card failed">

            <span className="stat-label">

              Failed

            </span>

            <strong className="stat-value">

              {failedDeployments}

            </strong>

          </div>

        </div>

      </div>

      {/* ACTION BAR */}

      <div className="history-actions">

        <div className="history-actions-left">

          <div className="history-live-indicator">

            <span className="history-live-dot"></span>

            Live Deployment Sync

          </div>

        </div>

        <div className="history-actions-right">

          <button
            className="history-action-btn ghost"
          >

            Refresh

          </button>

          <button
            className="history-action-btn danger"
            onClick={handleClearHistory}
          >

            Delete History

          </button>

        </div>

      </div>

      {/* GRID */}

      <div className="deployment-grid">

        {sortedDeployments.map(
          (
            deployment,
            index
          ) => (

            <div
              key={
                deployment.id ||
                index
              }
              className="deployment-grid-item"
              style={{
                animationDelay:
                  `${index * 0.06}s`,
              }}
            >

              <DeploymentItem
                deployment={
                  deployment
                }
                onDelete={
                  onDeleteDeployment
                }
              />

            </div>

          )
        )}

      </div>

    </div>

  );
}

export default DeploymentHistory;