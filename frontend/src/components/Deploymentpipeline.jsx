function DeploymentPipeline({ status }) {
  // Determine pipeline step based on deployment status
  const getSteps = () => {
    const allDone = status === "running";
    const building = status === "building";

    return [
      {
        icon: "✓",
        label: "Repository Cloned",
        sublabel: "Source code fetched",
        state: allDone || building ? "step-done" : "step-pending",
      },
      {
        icon: "✓",
        label: "Framework Detected",
        sublabel: "Auto-detected from source",
        state: allDone || building ? "step-done" : "step-pending",
      },
      {
        icon: "✓",
        label: "Docker Image Built",
        sublabel: "Image layers cached",
        state: allDone ? "step-done" : building ? "step-active" : "step-pending",
      },
      {
        icon: "⚡",
        label: "Container Running",
        sublabel: "Runtime active",
        state: allDone ? "step-done" : building ? "step-pending" : "step-pending",
      },
      {
        icon: "🌍",
        label: "Deployment Live",
        sublabel: "Public URL generated",
        state: allDone ? "step-done" : "step-pending",
      },
    ];
  };

  const steps = getSteps();

  return (
    <div className="pipeline-section">
      <h2>Deployment Pipeline</h2>
      <div className="pipeline-steps">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`pipeline-step ${step.state}`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="pipeline-icon">{step.icon}</div>
            <div>
              <div className="pipeline-label">{step.label}</div>
              <div className="pipeline-sublabel">{step.sublabel}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DeploymentPipeline;