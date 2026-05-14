import StatusBadge from "./StatusBadge";

function DeploymentItem({ deployment, index }) {
  const openDeployment = () => {
    if (deployment.url) window.open(deployment.url, "_blank");
  };

  const copyUrl = async () => {
    if (deployment.url) {
      await navigator.clipboard.writeText(deployment.url);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getProjectName = (repoUrl) => {
    if (!repoUrl) return "DeployX App";
    const parts = repoUrl.replace(/\.git$/, "").split("/");
    return parts[parts.length - 1] || "DeployX App";
  };

  return (
    <div
      className="deployment-item"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="deployment-top">
        <div>
          <h2>{getProjectName(deployment.repo_url)}</h2>
          <p className="repo-url">{deployment.repo_url}</p>
        </div>
        <StatusBadge status={deployment.status} />
      </div>

      <div className="deployment-details">
        <div>
          <span>Container</span>
          <p title={deployment.container_id}>
            {deployment.container_id
              ? deployment.container_id.slice(0, 12)
              : "—"}
          </p>
        </div>
        <div>
          <span>Port</span>
          <p>{deployment.port || "—"}</p>
        </div>
        <div>
          <span>Created</span>
          <p>{formatDate(deployment.created_at)}</p>
        </div>
      </div>

      <div className="deployment-footer">
        <div className="live-url" title={deployment.url}>
          {deployment.url || "No URL available"}
        </div>
        <button className="btn btn-ghost" onClick={copyUrl} disabled={!deployment.url}>
          Copy
        </button>
        <button className="btn btn-primary" onClick={openDeployment} disabled={!deployment.url}>
          Open ↗
        </button>
      </div>
    </div>
  );
}

export default DeploymentItem;