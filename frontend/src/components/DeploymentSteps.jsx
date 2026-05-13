function DeploymentSteps() {
  return (
    <div className="steps-container">
      <div className="step completed">✓ Repository Cloned</div>
      <div className="step completed">✓ Docker Build Complete</div>
      <div className="step active">⚡ Container Running</div>
      <div className="step">🌍 URL Generated</div>
    </div>
  );
}

export default DeploymentSteps;