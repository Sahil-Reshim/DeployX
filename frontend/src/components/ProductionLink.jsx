function ProductionLink({ deployment }) {

  if (!deployment) {

    return (
      <div className="production-link">

        <div className="production-top">

          <div>

            <h2>No Active Deployment</h2>

            <p>
              Deploy repository to generate URL
            </p>

          </div>

        </div>

      </div>
    );
  }

  return (

    <div className="production-link">

      <div className="production-top">

        <div>

          <h2>Production Deployment</h2>

          <p>
            Live deployment URL
          </p>

        </div>

      </div>

      <div className="url-box">
        {deployment.url}
      </div>

      <div className="button-group">

        <a
          href={deployment.url}
          target="_blank"
          rel="noreferrer"
        >
          <button className="btn btn-primary">
            Open Deployment
          </button>
        </a>

      </div>

    </div>

  );
}

export default ProductionLink;