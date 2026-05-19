import { useState } from "react";

import StatusBadge from "./StatusBadge";

function DeploymentItem({ deployment }) {

  const [copied, setCopied] =
    useState(false);

  const deployUrl =
    deployment?.url || "";

  const deploymentStatus =
    deployment?.status?.toLowerCase() ||
    "offline";

  const isLive =
    deploymentStatus === "running" ||
    deploymentStatus === "success" ||
    deploymentStatus === "live";

  const copyUrl = async () => {

    if (!deployUrl) return;

    try {

      await navigator.clipboard.writeText(
        deployUrl
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch (error) {

      console.error(
        "Failed to copy URL:",
        error
      );

    }
  };

  const openDeployment = () => {

    if (!deployUrl) return;

    window.open(
      deployUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const getTimeAgo = (date) => {

    if (!date) return "Unknown";

    const seconds = Math.floor(
      (new Date() - new Date(date)) / 1000
    );

    const intervals = [
      {
        label: "d",
        seconds: 86400
      },
      {
        label: "h",
        seconds: 3600
      },
      {
        label: "m",
        seconds: 60
      }
    ];

    for (const interval of intervals) {

      const count = Math.floor(
        seconds / interval.seconds
      );

      if (count >= 1) {
        return `${count}${interval.label} ago`;
      }
    }

    return "just now";
  };

  const getRepoName = () => {

    if (!deployment?.repo_url)
      return "Unknown Repository";

    return deployment.repo_url
      .replace(".git", "")
      .split("/")
      .slice(-2)
      .join("/");
  };

  return (

    <div className="deployment-item">

      <div className="deployment-shine"></div>

      <div className="deployment-top">

        <div>

          <div className="deployment-app-row">

            <div
              className={`mini-live-dot ${
                isLive
                  ? "online"
                  : "offline"
              }`}
            ></div>

            <h2>
              {deployment.framework ||
                "Unknown Framework"}
            </h2>

          </div>

          <p className="repo-url">
            {deployment.repo_url ||
              "No repository"}
          </p>

        </div>

        <StatusBadge
          status={deploymentStatus}
        />

      </div>

      <div className="deployment-details">

        <div>

          <span>Repository</span>

          <p>{getRepoName()}</p>

        </div>

        <div>

          <span>Framework</span>

          <p>
            {deployment.framework ||
              "Unknown"}
          </p>

        </div>

        <div>

          <span>Port</span>

          <p>
            {deployment.port || "N/A"}
          </p>

        </div>

        <div>

          <span>Status</span>

          <p>{deploymentStatus}</p>

        </div>

        <div>

          <span>Created</span>

          <p>
            {getTimeAgo(
              deployment.created_at
            )}
          </p>

        </div>

      </div>

      <div className="deployment-footer">

        <div className="live-url">

          {deployUrl ? (

            <>
              <span
                className={`url-live-badge ${
                  isLive
                    ? "online"
                    : "offline"
                }`}
              >

                {isLive
                  ? "LIVE"
                  : deploymentStatus.toUpperCase()}

              </span>

              {deployUrl}
            </>

          ) : (

            <span>
              Deployment URL not available
            </span>

          )}

        </div>

        <div className="button-group">

          <button
            className="btn btn-ghost"
            onClick={copyUrl}
            disabled={!deployUrl}
          >

            {copied
              ? "Copied!"
              : "Copy"}

          </button>

          <button
            className="btn btn-primary"
            onClick={openDeployment}
            disabled={!deployUrl}
          >

            Open

          </button>

        </div>

      </div>

      {deploymentStatus === "failed" && (

        <div className="deployment-error">

          <span>⚠</span>

          <p>

            {deployment.error ||
              "Deployment failed. Check logs for more details."}

          </p>

        </div>

      )}

    </div>

  );
}

export default DeploymentItem;