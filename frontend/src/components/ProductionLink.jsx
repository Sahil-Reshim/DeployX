import { useState } from "react";

function ProductionLink({ deployment }) {

  const [copied, setCopied] =
    useState(false);

  /*
    NO DEPLOYMENT
  */

  if (!deployment) {

    return (

      <div className="production-link no-deployment">

        <div className="production-glow"></div>

        <div className="live-status-row">

          <div className="live-pulse offline"></div>

          <span className="live-status-text">
            OFFLINE
          </span>

        </div>

        <h2>
          No Active Deployment
        </h2>

        <p>
          Deploy a repository to generate a live production URL.
        </p>

      </div>

    );
  }

  /*
    BACKEND ASYNC FLOW
  */

  const deploymentStatus =
    (
      deployment.status ||
      "offline"
    ).toLowerCase();

  const deploymentUrl =
    deployment.url || "";

  /*
    LIVE ONLY WHEN RUNNING
  */

  const isRunning =
    deploymentStatus ===
    "running";

  /*
    PROGRESS STATES
  */

  const isDeploying = [

    "queued",

    "cloning",

    "detecting",

    "dockerfile_generating",

    "building",

    "deploying",

  ].includes(
    deploymentStatus
  );

  /*
    COPY URL
  */

  const copyUrl = async () => {

    if (!deploymentUrl) return;

    try {

      await navigator.clipboard.writeText(
        deploymentUrl
      );

      setCopied(true);

      setTimeout(() => {

        setCopied(false);

      }, 2000);

    } catch (error) {

      console.error(
        "Failed to copy URL",
        error
      );

    }
  };

  /*
    OPEN URL
  */

  const openDeployment = () => {

    if (!deploymentUrl) return;

    window.open(
      deploymentUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /*
    FORMAT REPO NAME
  */

  const repoName =
    deployment.repo_url
      ? deployment.repo_url
          .replace(".git", "")
          .split("/")
          .slice(-2)
          .join("/")
      : "N/A";

  /*
    FORMAT TIME
  */

  const createdAt =
    deployment.created_at
      ? new Date(
          deployment.created_at
        ).toLocaleString()
      : "N/A";

  return (

    <div className="production-link">

      <div className="production-glow"></div>

      {/* HEADER */}

      <div className="production-top">

        <div>

          <div className="live-status-row">

            <div
              className={`live-pulse ${
                isRunning
                  ? "online"
                  : "offline"
              }`}
            />

            <span className="live-status-text">

              {isRunning
                ? "LIVE"
                : deploymentStatus
                    .replaceAll(
                      "_",
                      " "
                    )
                    .toUpperCase()}

            </span>

          </div>

          <h2>
            Production Deployment
          </h2>

          <p>
            Real deployment state from backend
          </p>

        </div>

        <div
          className={`status-chip ${deploymentStatus}`}
        >

          {deploymentStatus.replaceAll(
            "_",
            " "
          )}

        </div>

      </div>

      {/* URL */}

      <div className="live-url-wrapper">

        <div className="url-label">
          Production URL
        </div>

        {isRunning &&
        deploymentUrl ? (

          <div className="url-box">

            <span className="url-content">
              {deploymentUrl}
            </span>

          </div>

        ) : (

          <div className="url-box empty-url">

            {deploymentStatus ===
            "failed"

              ? "Deployment failed"

              : "URL will be generated after deployment completes"}

          </div>

        )}

      </div>

      {/* DEPLOYMENT META */}

      <div className="deployment-meta-grid">

        <div className="meta-card">

          <span>
            Framework
          </span>

          <strong>
            {deployment.framework ||
              "Detecting..."}
          </strong>

        </div>

        <div className="meta-card">

          <span>
            Port
          </span>

          <strong>
            {deployment.port ||
              "Pending"}
          </strong>

        </div>

        <div className="meta-card">

          <span>
            Status
          </span>

          <strong>

            {deploymentStatus.replaceAll(
              "_",
              " "
            )}

          </strong>

        </div>

        <div className="meta-card">

          <span>
            Repository
          </span>

          <strong className="repo-name">
            {repoName}
          </strong>

        </div>

        <div className="meta-card">

          <span>
            Created
          </span>

          <strong>
            {createdAt}
          </strong>

        </div>

        <div className="meta-card">

          <span>
            Deployment ID
          </span>

          <strong>
            #{deployment.id || "N/A"}
          </strong>

        </div>

      </div>

      {/* ACTIONS */}

      <div className="button-group">

        <button
          className="btn btn-ghost"
          onClick={copyUrl}
          disabled={!isRunning || !deploymentUrl}
        >

          {copied
            ? "Copied!"
            : "Copy URL"}

        </button>

        <button
          className="btn btn-primary"
          onClick={openDeployment}
          disabled={!isRunning || !deploymentUrl}
        >

          Open Deployment

        </button>

      </div>

      {/* FAILED */}

      {deploymentStatus ===
        "failed" && (

        <div className="deployment-error">

          <span>⚠</span>

          <p>

            {deployment.error ||
              "Deployment failed. Check logs for details."}

          </p>

        </div>

      )}

      {/* BUILDING */}

      {isDeploying && (

        <div className="deployment-progress">

          <div className="progress-label">

            Deployment in progress...

          </div>

          <div className="progress-bar">

            <div
              className={`progress-fill ${deploymentStatus}`}
            ></div>

          </div>

        </div>

      )}

    </div>

  );
}

export default ProductionLink;