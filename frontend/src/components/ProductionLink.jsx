function ProductionLink({ deployment }) {

  const deploymentUrl =
    deployment?.url;

  const deploymentStatus =
    deployment?.status;

  const openDeployment = () => {

    if (deploymentUrl) {

      window.open(
        deploymentUrl,
        "_blank"
      );
    }
  };

  const copyUrl = async () => {

    if (deploymentUrl) {

      await navigator.clipboard.writeText(
        deploymentUrl
      );

      alert(
        "Deployment URL Copied 🚀"
      );
    }
  };

  return (

    <div className="production-link">

      <div className="production-top">

        <div>

          <h2>
            Live Production Deployment
          </h2>

          <p>
            Latest deployed container
          </p>

        </div>

        <div className="status-badge">

          {

            deploymentStatus
            ?
            deploymentStatus
            :
            "offline"

          }

        </div>

      </div>

      <div className="url-box">

        {

          deploymentUrl
          ?
          deploymentUrl
          :
          "No Deployment Available"

        }

      </div>

      <div className="button-group">

        <button
          onClick={openDeployment}
          disabled={!deploymentUrl}
        >
          Open Deployment
        </button>

        <button
          onClick={copyUrl}
          disabled={!deploymentUrl}
        >
          Copy URL
        </button>

      </div>

    </div>
  );
}

export default ProductionLink;