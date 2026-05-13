function DeploymentSteps() {

  return (

    <div className="steps-container">

      <h2>Deployment Pipeline</h2>

      <div className="step completed">
        ✓ Repository Cloned
      </div>

      <div className="step completed">
        ✓ Docker Image Built
      </div>

      <div className="step active">
        ⚡ Container Running
      </div>

      <div className="step">
        🌍 Production URL Generated
      </div>

    </div>
  );
}

export default DeploymentSteps;