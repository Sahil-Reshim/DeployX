import React from "react";

function DeploymentPipeline({ stateKey, progress }) {
  const normalizedStateKey = (stateKey || "").toLowerCase().trim();
  const progressPercent = Math.min(100, Math.max(0, Number(progress) || 0));

  const steps = [
    { key: "source", label: "Source" },
    { key: "clone", label: "Clone" },
    { key: "build", label: "Build" },
    { key: "ci", label: "CI" },
    { key: "docker", label: "Docker" },
    { key: "deploy", label: "Deploy" },
    { key: "verify", label: "Verify" },
    { key: "live", label: "Live" },
  ];

  const stageThresholds = steps.map((_, index) =>
    Math.round(((index + 1) / steps.length) * 100)
  );

  const stepStates = steps.map((step, index) => {
    if (progressPercent >= stageThresholds[index]) {
      return "done";
    }

    const previousThreshold = index === 0 ? 0 : stageThresholds[index - 1];
    if (progressPercent > previousThreshold && progressPercent < stageThresholds[index]) {
      return "active";
    }

    return "pending";
  });

  const activeIndex = stepStates.findIndex((state) => state === "active");
  const currentStageLabel =
    steps[
      activeIndex >= 0
        ? activeIndex
        : Math.min(
            steps.length - 1,
            Math.floor((progressPercent / 100) * steps.length)
          )
    ]?.label || "Source";

  const statusLabel = normalizedStateKey
    ? normalizedStateKey
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (match) => match.toUpperCase())
    : "Waiting";

  const statusClass = normalizedStateKey.includes("fail")
    ? "failed"
    : normalizedStateKey.includes("run") ||
      normalizedStateKey.includes("progress") ||
      normalizedStateKey.includes("build") ||
      normalizedStateKey.includes("deploy")
    ? "running"
    : normalizedStateKey.includes("success") ||
      normalizedStateKey.includes("live")
    ? "success"
    : "idle";

  const lastUpdate = progressPercent > 0 ? "Now" : "Pending";
  const successRate = normalizedStateKey.includes("success")
    ? "100%"
    : normalizedStateKey.includes("fail")
    ? "0%"
    : `${Math.max(12, Math.round(progressPercent * 0.9))}%`;

  return (
    <div className="pipeline-section">
      <div className="pipeline-header">
        <div className="pipeline-header-left">
          <span className="pipeline-mini-label">DeployX production flow</span>
          <h2>Deployment pipeline</h2>
          <p className="pipeline-description">
            High-level production stages with clean horizontal flow.
          </p>
        </div>

        <div className={`pipeline-status ${statusClass}`}>
          <span className="pipeline-status-dot"></span>
          <span>{statusLabel}</span>
        </div>
      </div>

      <div className="pipeline-summary-row">
        <div className="pipeline-summary-card">
          <span>Status</span>
          <strong>{statusLabel}</strong>
        </div>
        <div className="pipeline-summary-card">
          <span>Current stage</span>
          <strong>{currentStageLabel}</strong>
        </div>
        <div className="pipeline-summary-card">
          <span>Progress</span>
          <strong>{progressPercent}%</strong>
        </div>
      </div>

      <div className="pipeline-track">
        {steps.map((step, index) => {
          const stepState = stepStates[index];
          const icon =
            stepState === "done"
              ? "✓"
              : stepState === "active"
              ? "●"
              : "○";
          const connectorState =
            index < steps.length - 1
              ? stepStates[index] === "done"
                ? stepStates[index + 1] === "failed"
                  ? "failed"
                  : "done"
                : "pending"
              : "pending";

          return (
            <React.Fragment key={step.key}>
              <div className={`pipeline-step step-${stepState}`}>
                <div className="pipeline-node">{icon}</div>
                <div className="pipeline-label">{step.label}</div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`pipeline-connector ${connectorState}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="pipeline-footer-row">
        <div className="pipeline-footer-card">
          <span>Last update</span>
          <strong>{lastUpdate}</strong>
        </div>
        <div className="pipeline-footer-card">
          <span>Success rate</span>
          <strong>{successRate}</strong>
        </div>
      </div>
    </div>
  );
}

export default DeploymentPipeline;
