import { useState } from "react";

function ProductionLink({ deployment }) {
  const [copied, setCopied] = useState(false);

  // Empty deployment state
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

        <h2>No Active Deployment</h2>

        <p>
          Deploy a repository to generate a live production URL.
        </p>
      </div>
    );
  }

  const deploymentUrl = deployment.url || "";

  // Backend updated statuses
  const isRunning =
    deployment.status === "running" ||
    deployment.status === "success";

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

  const openDeployment = () => {
    if (!deploymentUrl) return;

    window.open(
      deploymentUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // Format repository name
  const repoName = deployment.repo_url
    ? deployment.repo_url
        .replace(".git", "")
        .split("/")
        .slice(-2)
        .join("/")
    : "N/A";

  // Format created time
  const createdAt = deployment.created_at
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
                : (
                    deployment.status ||
                    "offline"
                  ).toUpperCase()}
            </span>
          </div>

          <h2>Production Deployment</h2>

          <p>
            Real deployment state from backend
          </p>
        </div>

        <div
          className={`status-chip ${
            deployment.status ||
            "offline"
          }`}
        >
          {deployment.status ||
            "offline"}
        </div>
      </div>

      {/* URL */}

      <div className="live-url-wrapper">
        <div className="url-label">
          Production URL
        </div>

        {deploymentUrl ? (
          <div className="url-box">
            <span className="url-content">
              {deploymentUrl}
            </span>
          </div>
        ) : (
          <div className="url-box empty-url">
            URL not generated yet
          </div>
        )}
      </div>

      {/* DEPLOYMENT META */}

      <div className="deployment-meta-grid">
        <div className="meta-card">
          <span>Framework</span>

          <strong>
            {deployment.framework ||
              "Unknown"}
          </strong>
        </div>

        <div className="meta-card">
          <span>Port</span>

          <strong>
            {deployment.port || "N/A"}
          </strong>
        </div>

        <div className="meta-card">
          <span>Status</span>

          <strong>
            {deployment.status ||
              "offline"}
          </strong>
        </div>

        <div className="meta-card">
          <span>Repository</span>

          <strong className="repo-name">
            {repoName}
          </strong>
        </div>

        <div className="meta-card">
          <span>Created</span>

          <strong>
            {createdAt}
          </strong>
        </div>

        <div className="meta-card">
          <span>Deployment ID</span>

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
          disabled={!deploymentUrl}
        >
          {copied
            ? "Copied!"
            : "Copy URL"}
        </button>

        <button
          className="btn btn-primary"
          onClick={openDeployment}
          disabled={!deploymentUrl}
        >
          Open Deployment
        </button>
      </div>

      {/* FAILED ERROR */}

      {deployment.status ===
        "failed" && (
        <div className="deployment-error">
          <span>⚠</span>

          <p>
            {deployment.error ||
              "Deployment failed. Check logs for details."}
          </p>
        </div>
      )}

      {/* BUILDING STATE */}

      {(deployment.status ===
        "building" ||
        deployment.status ===
          "cloning" ||
        deployment.status ===
          "deploying" ||
        deployment.status ===
          "queued") && (
        <div className="deployment-progress">
          <div className="progress-label">
            Deployment in progress...
          </div>

          <div className="progress-bar">
            <div
              className={`progress-fill ${deployment.status}`}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductionLink;