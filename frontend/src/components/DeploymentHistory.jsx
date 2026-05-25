import { useMemo } from "react";

import DeploymentItem from "./DeploymentItem";

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPLOYMENT HISTORY COMPONENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

function DeploymentHistory({

  deployments = [],
  loading = false,

  onDeleteDeployment,
  onRefresh,

}) {

  /*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SORT DEPLOYMENTS (LATEST FIRST)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  */

  const sortedDeployments = useMemo(() => {

    return [...deployments].sort((a, b) => {

      return (
        new Date(
          b.created_at || 0
        ).getTime()
        -
        new Date(
          a.created_at || 0
        ).getTime()
      );

    });

  }, [deployments]);

  /*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DEPLOYMENT STATS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  */

  const totalDeployments =
    sortedDeployments.length;

  /*
    SUCCESSFUL DEPLOYMENTS
  */

  const successfulDeployments =
    sortedDeployments.filter(
      (deployment) => {

        const status =
          (
            deployment.status || ""
          ).toLowerCase();

        return [

          "running",
          "success",
          "live",
          "completed",

        ].includes(status);

      }
    ).length;

  /*
    FAILED DEPLOYMENTS
  */

  const failedDeployments =
    sortedDeployments.filter(
      (deployment) => {

        return (
          deployment.status
            ?.toLowerCase()
          === "failed"
        );

      }
    ).length;

  /*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DELETE DEPLOYMENT
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  */

  const handleDelete = async (
    deploymentId
  ) => {

    /*
      CHECK ID
    */

    if (!deploymentId) {

      alert(
        "Deployment ID missing"
      );

      return;

    }

    /*
      CONFIRM DELETE
    */

    const confirmed =
      window.confirm(
        "Delete this deployment permanently?"
      );

    if (!confirmed) return;

    /*
      CALL PARENT DELETE FUNCTION
    */

    try {

      if (onDeleteDeployment) {

        await onDeleteDeployment(
          deploymentId
        );

      }

    } catch (error) {

      console.error(
        "Delete Error:",
        error
      );

    }

  };

  /*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  LOADING UI
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  */

  if (loading) {

    return (

      <div className="history-loading">

        <div className="history-loader"></div>

        <h2>
          Loading Deployments
        </h2>

        <p>
          Fetching deployment history...
        </p>

      </div>

    );

  }

  /*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EMPTY UI
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  */

  if (!deployments.length) {

    return (

      <div className="history-empty">

        <div className="history-empty-icon">
          🚀
        </div>

        <h2>
          No Deployments Yet
        </h2>

        <p>
          Deploy your first repository
          to start runtime history.
        </p>

      </div>

    );

  }

  /*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MAIN UI
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  */

  return (

    <div className="deployment-history">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━
          HEADER
      ━━━━━━━━━━━━━━━━━━━━━━━ */}

      <div className="deployment-history-header">

        {/* LEFT SIDE */}

        <div className="deployment-history-left">

          <div className="history-mini-badge">

            DEPLOYX RUNTIME

          </div>

          <h2>

            Deployment History

          </h2>

          <p>

            Monitor, manage and track
            all deployments in real time.

          </p>

        </div>

        {/* RIGHT STATS */}

        <div className="deployment-history-right">

          {/* TOTAL */}

          <div className="history-stat-card">

            <span className="stat-label">
              Total
            </span>

            <strong className="stat-value">

              {totalDeployments}

            </strong>

          </div>

          {/* LIVE */}

          <div className="history-stat-card success">

            <span className="stat-label">
              Live
            </span>

            <strong className="stat-value">

              {successfulDeployments}

            </strong>

          </div>

          {/* FAILED */}

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

      {/* ━━━━━━━━━━━━━━━━━━━━━━━
          ACTIONS
      ━━━━━━━━━━━━━━━━━━━━━━━ */}

      <div className="history-actions">

        {/* LIVE INDICATOR */}

        <div className="history-live-indicator">

          <span className="history-live-dot"></span>

          Live Sync Enabled

        </div>

        {/* ACTION BUTTONS */}

        <div className="history-actions-right">

          <button
            className="
              history-action-btn
              ghost
            "
            onClick={onRefresh}
          >

            Refresh

          </button>

        </div>

      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━
          DEPLOYMENT GRID
      ━━━━━━━━━━━━━━━━━━━━━━━ */}

      <div className="deployment-grid">

        {sortedDeployments.map(

          (deployment, index) => {

            /*
              CHECK FAILED STATUS
            */

            const isFailed =
              deployment.status
                ?.toLowerCase()
              === "failed";

            return (

              <div
                key={
                  deployment.id ||
                  index
                }
                className="
                  deployment-grid-item
                "
              >

                {/* ━━━━━━━━━━━
                    CARD WRAPPER
                ━━━━━━━━━━━ */}

                <div className="
                  deployment-card-wrapper
                ">

                  {/* DELETE BUTTON */}

                  <button
                    className="
                      deployment-delete-btn
                    "
                    onClick={() =>
                      handleDelete(
                        deployment.id
                      )
                    }
                    title="
                      Delete Deployment
                    "
                  >

                    ✕

                  </button>

                  {/* FAILED BADGE */}

                  {isFailed && (

                    <div className="
                      failed-badge
                    ">

                      FAILED

                    </div>

                  )}

                  {/* DEPLOYMENT CARD */}

                  <DeploymentItem
                    deployment={
                      deployment
                    }
                  />

                </div>

              </div>

            );

          }

        )}

      </div>

    </div>

  );

}

export default DeploymentHistory;