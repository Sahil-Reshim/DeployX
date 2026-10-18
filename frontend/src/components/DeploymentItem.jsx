import { useMemo, useState } from "react";

import StatusBadge from "./StatusBadge";

function DeploymentItem({
  deployment,
  onDeleteDeployment,
  onStartDeployment,
  onStopDeployment,
  onRestartDeployment,
  actionLoading
}) {

  const [copied, setCopied] =
    useState(false);

  /*
  ─────────────────────────────────────────────
  NORMALIZED DATA
  ─────────────────────────────────────────────
  */

  // Never open a dead localhost URL. Legacy Docker-port rows store
  // local_url/url like http://localhost:5002 which is unreachable
  // under the K8s Ingress model (canonical: /apps/<id>/).
  // Only custom_url/url (Ingress URL) are browser-reachable.
  const rawUrl = deployment?.custom_url || deployment?.url || "";
  const deployUrl =
    rawUrl && !/localhost|127\.0\.0\.1/.test(rawUrl) ? rawUrl : "";

  const deploymentStatus =
    (
      deployment?.status ||
      "offline"
    ).toLowerCase();

  const framework =
    deployment?.framework ||
    "Unknown Framework";

  const isLive = [

    "running",
    "success",
    "live",
    "completed",

  ].includes(
    deploymentStatus
  );

  /*
  ─────────────────────────────────────────────
  ACTION STATES
  ─────────────────────────────────────────────
  */

  const isStopped =
    deploymentStatus === "stopped";

  const isRestarting =
    deploymentStatus === "restarting";

  const isTransitioning = [

    "queued",
    "cloning",
    "detecting",
    "dockerfile_generating",
    "building",
    "deploying",
    "restarting"

  ].includes(
    deploymentStatus
  );

  /*
  ─────────────────────────────────────────────
  LOADING STATES
  ─────────────────────────────────────────────
  */

  const isStarting =
    actionLoading === "starting";

  const isStopping =
    actionLoading === "stopping";

  const isRestartAction =
    actionLoading === "restarting";

  /*
  ─────────────────────────────────────────────
  REPOSITORY NAME
  ─────────────────────────────────────────────
  */

  const repositoryName =
    useMemo(() => {

      if (!deployment?.repo_url) {

        return "Unknown Repository";

      }

      return deployment.repo_url
        .replace(".git", "")
        .split("/")
        .slice(-2)
        .join("/");

    }, [deployment]);

  /*
  ─────────────────────────────────────────────
  TIME AGO
  ─────────────────────────────────────────────
  */

  const getTimeAgo =
    (date) => {

      if (!date)
        return "Unknown";

      const seconds =
        Math.floor(
          (
            new Date() -
            new Date(date)
          ) / 1000
        );

      const intervals = [

        {
          label: "d",
          value: 86400,
        },

        {
          label: "h",
          value: 3600,
        },

        {
          label: "m",
          value: 60,
        },

      ];

      for (const interval of intervals) {

        const count =
          Math.floor(
            seconds /
            interval.value
          );

        if (count >= 1) {

          return `${count}${interval.label} ago`;

        }

      }

      return "just now";
    };

  /*
  ─────────────────────────────────────────────
  COPY URL
  ─────────────────────────────────────────────
  */

  const copyUrl =
    async () => {

      if (!deployUrl)
        return;

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
          "Copy failed:",
          error
        );

      }
    };

  /*
  ─────────────────────────────────────────────
  OPEN DEPLOYMENT
  ─────────────────────────────────────────────
  */

  const openDeployment =
    () => {

      // Never open a missing/stale URL (e.g. legacy http://localhost:5002
      // rows or stopped/failed deploys). That is what produced
      // "Unsafe attempt to load URL http://localhost:5002/ from frame
      // with URL chrome-error://chromewebdata/".
      if (!deployUrl || !isLive) {
        return;
      }

      window.open(
        deployUrl,
        "_blank",
        "noopener,noreferrer"
      );
    };

  /*
  ─────────────────────────────────────────────
  STATUS LABEL
  ─────────────────────────────────────────────
  */

  const readableStatus =
    deploymentStatus.replaceAll(
      "_",
      " "
    );

  return (

    <div
      className={`deployment-item ${deploymentStatus}`}
    >

      <div className="deployment-bg-grid"></div>

      <div className="deployment-glow"></div>

      <div className="deployment-shine"></div>

      {/* HEADER */}

      <div className="deployment-top">

        <div className="deployment-left">

          <div className="deployment-app-row">

            <div
              className={`mini-live-dot ${
                isLive
                  ? "online"
                  : "offline"
              }`}
            ></div>

            <h2>
              {framework}
            </h2>

          </div>

          <p className="repo-url">

            {deployment.repo_url ||
              "Repository URL unavailable"}

          </p>

        </div>

        <StatusBadge
          status={
            deploymentStatus
          }
        />

      </div>

      {/* URL */}

      <div className="deployment-live-preview">

        <div className="deployment-live-header">

          <span className="deployment-live-label">

            Production Endpoint

          </span>

          <span
            className={`deployment-live-status ${
              isLive
                ? "online"
                : "offline"
            }`}
          >

            {isLive
              ? "LIVE"
              : readableStatus}

          </span>

        </div>

        <div
          className={`deployment-live-box ${
            !deployUrl
              ? "empty"
              : ""
          }`}
        >

          {deployUrl || (
            <span>

              Deployment URL will appear
              after successful runtime startup.

            </span>
          )}

        </div>

      </div>

      {/* DETAILS */}

      <div className="deployment-details">

        <div className="deployment-detail-card">
          <span>Repository</span>
          <p>{repositoryName}</p>
        </div>

        <div className="deployment-detail-card">
          <span>Framework</span>
          <p>{framework}</p>
        </div>

        <div className="deployment-detail-card">
          <span>Port</span>
          <p>{deployment.port || "Pending"}</p>
        </div>

        <div className="deployment-detail-card">
          <span>Status</span>
          <p className={deploymentStatus}>
            {readableStatus}
          </p>
        </div>

        <div className="deployment-detail-card">
          <span>Created</span>
          <p>
            {getTimeAgo(
              deployment.created_at
            )}
          </p>
        </div>

        <div className="deployment-detail-card">
          <span>Deployment ID</span>
          <p>
            #{deployment.id || "N/A"}
          </p>
        </div>

      </div>

      {/* ACTIONS */}

      <div className="deployment-actions">

        <button
          className="action-btn start-btn"
          onClick={() =>
            onStartDeployment(
              deployment.id
            )
          }
          disabled={
            !isStopped ||
            isTransitioning ||
            !!actionLoading
          }
        >

          {isStarting
            ? "Starting..."
            : "Start"}

        </button>

        <button
          className="action-btn stop-btn"
          onClick={() =>
            onStopDeployment(
              deployment.id
            )
          }
          disabled={
            isStopped ||
            isTransitioning ||
            !!actionLoading
          }
        >

          {isStopping
            ? "Stopping..."
            : "Stop"}

        </button>

        <button
          className="action-btn restart-btn"
          onClick={() =>
            onRestartDeployment(
              deployment.id
            )
          }
          disabled={
            isRestarting ||
            isTransitioning ||
            !!actionLoading
          }
        >

          {isRestartAction
            ? "Restarting..."
            : "Restart"}

        </button>

        <button
          className="action-btn delete-btn"
          onClick={() =>
            onDeleteDeployment(
              deployment.id
            )
          }
          disabled={!!actionLoading}
        >

          Delete

        </button>

      </div>

      {/* FOOTER */}

      <div className="deployment-footer">

        <div className="deployment-runtime-info">

          <div className="runtime-dot"></div>

          <span>

            Real-time deployment monitoring active

          </span>

        </div>

        <div className="button-group">

          <button
            className="btn btn-ghost"
            onClick={copyUrl}
            disabled={!deployUrl}
          >

            {copied
              ? "Copied!"
              : "Copy URL"}

          </button>

          <button
            className="btn btn-primary"
            onClick={
              openDeployment
            }
            disabled={!deployUrl || !isLive}
            title={!deployUrl ? "No live URL for this deployment" : !isLive ? `Deployment is ${deploymentStatus} — open is only available when Live` : "Open live app"}
          >

            Open Deployment

          </button>

        </div>

      </div>

      {/* FAILED */}

      {deploymentStatus ===
        "failed" && (

        <div className="deployment-error">

          <div className="deployment-error-icon">

            ⚠

          </div>

          <div>

            <strong>

              Deployment Failed

            </strong>

            <p>

              {deployment.error ||
                "Runtime container failed during deployment pipeline execution."}

            </p>

          </div>

        </div>

      )}

    </div>

  );
}

export default DeploymentItem;