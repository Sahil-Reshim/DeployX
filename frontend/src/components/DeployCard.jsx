function DeployCard({ status, project }) {

  return (

    <div className="deploy-card">

      <div className="card-top">

        <h2>{project}</h2>

        <div className="live-status">
          <div className="live-dot"></div>
          {status}
        </div>

      </div>

      <p>
        Smart containerized deployment running successfully.
      </p>

    </div>
  );
}

export default DeployCard;