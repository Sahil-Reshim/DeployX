import StatusBadge from "./StatusBadge";

function DeploymentItem({ deployment }) {

  return (

    <div className="deployment-item">

      <div className="deployment-top">

        <div>

          <h2>
            {deployment.framework || "Unknown App"}
          </h2>

          <p className="repo-url">
            {deployment.repo_url}
          </p>

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
          <p>
            {deployment.created_at || "N/A"}
          </p>
        </div>

      </div>

      <div className="deployment-footer">

        <div className="live-url">
          {deployment.url}
        </div>

        <a
          href={deployment.url}
          target="_blank"
          rel="noreferrer"
        >
          <button className="btn btn-primary">
            Open
          </button>
        </a>

      </div>

    </div>

  );
}

export default DeploymentItem;