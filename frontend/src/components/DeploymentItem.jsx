import { useState } from "react";

import StatusBadge from "./StatusBadge";

function DeploymentItem({ deployment }) {

  const [copied, setCopied] = useState(false);

  const deployUrl = deployment.local_url || deployment.url;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(deployUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    const intervals = [
      { label: "d", seconds: 86400 },
      { label: "h", seconds: 3600 },
      { label: "m", seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) return `${count}${interval.label} ago`;
    }

    return "just now";
  };

  return (
    <div className="deployment-item">

      <div className="deployment-shine"></div>

      <div className="deployment-top">
        <div>
          <div className="deployment-app-row">
            <div
              className={`mini-live-dot ${
                deployment.status === "running" || deployment.status === "live"
                  ? "online"
                  : "offline"
              }`}
            ></div>
            <h2>{deployment.framework || "Unknown App"}</h2>
          </div>
          <p className="repo-url">{deployment.repo_url}</p>
        </div>
        <StatusBadge status={deployment.status} />
      </div>

      <div className="deployment-details">
        <div>
          <span>Framework</span>
          <p>{deployment.framework}</p>
        </div>
        <div>
          <span>Port</span>
          <p>{deployment.port}</p>
        </div>
        <div>
          <span>Created</span>
          <p>{getTimeAgo(deployment.created_at)}</p>
        </div>
      </div>

      <div className="deployment-footer">
        <div className="live-url">
          <span className="url-live-badge">LIVE</span>
          {deployUrl}
        </div>

        <div className="button-group">
          <button className="btn btn-ghost" onClick={copyUrl}>
            {copied ? "Copied!" : "Copy"}
          </button>

          <a href={deployUrl} target="_blank" rel="noreferrer">
            <button className="btn btn-primary">Open</button>
          </a>
        </div>
      </div>

    </div>
  );
}

export default DeploymentItem;