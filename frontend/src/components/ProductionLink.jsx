import { useState } from "react";
import StatusBadge from "./StatusBadge";

function ProductionLink({ deployment }) {
  const [copied, setCopied] = useState(false);

  const deploymentUrl = deployment?.url;
  const deploymentStatus = deployment?.status;

  const openDeployment = () => {
    if (deploymentUrl) window.open(deploymentUrl, "_blank");
  };

  const copyUrl = async () => {
    if (deploymentUrl) {
      await navigator.clipboard.writeText(deploymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="production-link">
      <div className="production-top">
        <div>
          <h2>Live Production Deployment</h2>
          <p>Latest deployed container</p>
        </div>
        <StatusBadge status={deploymentStatus || "offline"} />
      </div>

      <div className="url-box">
        {deploymentUrl || "No Deployment Available"}
      </div>

      <div className="button-group">
        <button
          className="btn btn-primary"
          onClick={openDeployment}
          disabled={!deploymentUrl}
        >
          ↗ Open Deployment
        </button>
        <button
          className="btn btn-ghost"
          onClick={copyUrl}
          disabled={!deploymentUrl}
        >
          {copied ? "✓ Copied!" : "⎘ Copy URL"}
        </button>
      </div>
    </div>
  );
}

export default ProductionLink;