import { useState } from "react";

function ProductionLink({
  deployment
}) {

  const [copied, setCopied] =
    useState(false);

  if (!deployment) {

    return (

      <div className="production-link empty">

        <div className="production-grid"></div>

        <div className="live-indicator offline"></div>

        <h2>
          No Active Deployment
        </h2>

        <p>
          Deploy a repository to
          generate a live production
          URL.
        </p>

      </div>

    );
  }

  const deploymentStatus =
    (
      deployment.status ||
      "offline"
    ).toLowerCase();

  // The backend always provides the final public URL (K8s Ingress URL,
  // e.g. http://deployx.local/apps/17/). Never fall back to a localhost
  // local_url — that field is legacy from the old Docker-port model and
  // opening it (e.g. http://localhost:5002) produces
  // "Unsafe attempt to load URL ... from chrome-error://chromewebdata/".
  const rawUrl =
    deployment.custom_url ||
    deployment.url ||
    "";
  const deploymentUrl =
    rawUrl && !/localhost|127\.0\.0\.1/.test(rawUrl)
      ? rawUrl
      : "";

  const displayUrl =
    deployment.custom_url ||
    deployment.url ||
    "";

  const isRunning =
    deploymentStatus ===
      "running" ||
    deploymentStatus ===
      "success" ||
    deploymentStatus ===
      "live";

  const isFailed =
    deploymentStatus ===
    "failed";

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

      console.error(error);

    }
  };

  const openDeployment =
    () => {

      // Only open when the app is actually Live with a valid URL.
      if (!deploymentUrl || !isRunning)
        return;

      window.open(
        deploymentUrl,
        "_blank",
        "noopener,noreferrer"
      );
    };

  return (

    <div className="production-link">

      <div className="production-glow"></div>

      <div className="production-header">

        <div>

          <div className="live-status-row">

            <div
              className={`live-pulse ${
                isRunning
                  ? "online"
                  : "offline"
              }`}
            ></div>

            <span>

              {isRunning
                ? "LIVE"
                : deploymentStatus.replaceAll(
                    "_",
                    " "
                  )}

            </span>

          </div>

          <h2>
            Production Deployment
          </h2>

        </div>

        <div
          className={`status-chip ${deploymentStatus}`}
        >

          {deploymentStatus}

        </div>

      </div>

      <div className="live-url-wrapper">

        <span className="url-label">
          Production URL
        </span>

        <div
          className={`url-box ${
            !deploymentUrl
              ? "empty-url"
              : ""
          }`}
        >

          {displayUrl ||
            "Waiting for deployment URL..."}

        </div>

      </div>

      <div className="deployment-meta-grid">

        <div className="meta-card">

          <span>
            Framework
          </span>

          <strong>
            {deployment.framework ||
              "Detecting"}
          </strong>

        </div>

        <div className="meta-card">

          <span>Status</span>

          <strong>
            {deploymentStatus}
          </strong>

        </div>

        <div className="meta-card">

          <span>Port</span>

          <strong>
            {deployment.port ||
              "Pending"}
          </strong>

        </div>

      </div>

      <div className="button-group">

        <button
          className="btn btn-secondary"
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
          disabled={!deploymentUrl || !isRunning}
          title={!deploymentUrl ? "No live URL yet — wait for the deployment to go Live" : !isRunning ? `Deployment is ${deploymentStatus} — Open App is only available when Live` : "Open live app"}
        >

          Open App

        </button>

      </div>

      {isDeploying && (

        <div className="deployment-progress">

          <div className="progress-bar">

            <div className="progress-fill"></div>

          </div>

        </div>

      )}

      {isFailed && (

        <div className="deployment-error">

          {deployment.error ||
            "Deployment failed"}

        </div>

      )}

    </div>
  );
}

export default ProductionLink;