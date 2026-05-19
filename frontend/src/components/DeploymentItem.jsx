import { useMemo, useState } from "react";

import StatusBadge from "./StatusBadge";

function DeploymentItem({
  deployment
}) {

  const [copied, setCopied] =
    useState(false);

  /*
    NORMALIZED DATA
  */

  const deployUrl =
    deployment?.url || "";

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
    REPOSITORY NAME
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
    TIME AGO
  */

  const getTimeAgo = (
    date
  ) => {

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
    COPY URL
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
    OPEN DEPLOYMENT
  */

  const openDeployment =
    () => {

      if (!deployUrl)
        return;

      window.open(
        deployUrl,
        "_blank",
        "noopener,noreferrer"
      );
    };

  /*
    STATUS LABEL
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

      {/* BACKGROUND FX */}

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

      {/* URL PREVIEW */}

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

      {/* META GRID */}

      <div className="deployment-details">

        <div className="deployment-detail-card">

          <span>
            Repository
          </span>

          <p>
            {repositoryName}
          </p>

        </div>

        <div className="deployment-detail-card">

          <span>
            Framework
          </span>

          <p>
            {framework}
          </p>

        </div>

        <div className="deployment-detail-card">

          <span>
            Port
          </span>

          <p>

            {deployment.port ||
              "Pending"}

          </p>

        </div>

        <div className="deployment-detail-card">

          <span>
            Status
          </span>

          <p className={deploymentStatus}>

            {readableStatus}

          </p>

        </div>

        <div className="deployment-detail-card">

          <span>
            Created
          </span>

          <p>

            {getTimeAgo(
              deployment.created_at
            )}

          </p>

        </div>

        <div className="deployment-detail-card">

          <span>
            Deployment ID
          </span>

          <p>

            #{deployment.id || "N/A"}

          </p>

        </div>

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
            disabled={!deployUrl}
          >

            Open Deployment

          </button>

        </div>

      </div>

      {/* FAILED STATE */}

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