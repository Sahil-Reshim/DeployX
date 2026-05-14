function LogsViewer() {

  return (

    <div className="logs-container">

      <h2>
        Deployment Engine
      </h2>

      <div className="logs-box">

        <p>[SYSTEM] Listening for deployment events...</p>

        <p>[DOCKER] Runtime connected...</p>

        <p>[DEPLOYX] Waiting for new deployments...</p>

      </div>

    </div>
  );
}

export default LogsViewer;