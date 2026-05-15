import { useState } from "react";

function ProductionLink({ deployment }) {
  const [copied, setCopied] = useState(false);

  if (!deployment || !deployment.url) {
    return (
      <div className="production-link no-deployment">
        <div className="live-pulse offline"></div>

        <h2>No Active Deployment</h2>

        <p>Waiting for deployment...</p>
      </div>
    );
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(deployment.url);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const isRunning = deployment.status === "running";

  return (
    <div className="production-link">
      <div className="production-glow"></div>

      <div className="production-top">
        <div>
          <div className="live-status-row">
            <div
              className={`live-pulse ${
                isRunning ? "online" : "offline"
              }`}
            />

            <span className="live-status-text">
              {isRunning ? "LIVE" : "OFFLINE"}
            </span>
          </div>

          <h2>Live Production</h2>

          <p>Current active deployment</p>
        </div>

        <div
          className={`status-chip ${
            deployment.status
          }`}
        >
          {deployment.status}
        </div>
      </div>

      <div className="live-url-wrapper">
        <div className="url-label">
          Production URL
        </div>

        <div className="url-box">
          <span className="url-prefix">
            https://
          </span>

          <span className="url-content">
            {deployment.url.replace(
              "https://",
              ""
            )}
          </span>
        </div>
      </div>

      <div className="deployment-meta-grid">
        <div className="meta-card">
          <span>Framework</span>

          <strong>
            {deployment.framework || "Unknown"}
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
            {deployment.status}
          </strong>
        </div>
      </div>

      <div className="button-group">
        <button
          className="btn btn-ghost"
          onClick={copyUrl}
        >
          {copied ? "Copied!" : "Copy URL"}
        </button>

        <a
          className="deploy-link"
          href={deployment.url}
          target="_blank"
          rel="noreferrer"
        >
          Open Deployment
        </a>
      </div>
    </div>
  );
}

export default ProductionLink;