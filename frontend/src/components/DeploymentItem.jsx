import StatusBadge from "./StatusBadge";

function DeploymentItem({ deployment }) {

  const openDeployment = () => {
    window.open(deployment.url, "_blank");
  };

  return (

    <div className="deployment-item">

      <div className="deployment-top">

        <div>

          <h2>
            DeployX App
          </h2>

          <p className="repo-url">
            {deployment.repo_url}
          </p>

        </div>

        <StatusBadge status={deployment.status} />

      </div>

      <div className="deployment-details">

        <div>
          <span>Container</span>
          <p>{deployment.container_id}</p>
        </div>

        <div>
          <span>Port</span>
          <p>{deployment.port}</p>
        </div>

        <div>
          <span>Created</span>
          <p>{deployment.created_at}</p>
        </div>

      </div>

      <div className="deployment-footer">

        <div className="live-url">
          {deployment.url}
        </div>

        <button onClick={openDeployment}>
          Open App
        </button>

      </div>

    </div>
  );
}

export default DeploymentItem;