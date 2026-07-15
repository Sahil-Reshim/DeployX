import React from "react";
import { motion } from "framer-motion";

function DeploymentPipeline({ stateKey, progress }) {
  const normalizedStateKey = (stateKey || "").toLowerCase().trim();
  const progressPercent = Math.min(100, Math.max(0, Number(progress) || 0));

  const steps = [
    { key: "source", label: "Repository" },
    { key: "clone", label: "Clone" },
    { key: "detect", label: "Detect\nFramework" },
    { key: "dockerfile", label: "Generate\nDockerfile" },
    { key: "queue", label: "Jenkins\nQueue" },
    { key: "ci", label: "CI\nPipeline" },
    { key: "docker", label: "Docker\nBuild" },
    { key: "container", label: "Container" },
    { key: "health", label: "Health\nCheck" },
    { key: "prod", label: "Production" },
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

  const completedCount = stepStates.filter((s) => s === "done").length;
  const lastUpdate = progressPercent > 0 ? "Now" : "Pending";
  const successRate = normalizedStateKey.includes("success")
    ? "100%"
    : normalizedStateKey.includes("fail")
    ? "0%"
    : `${Math.max(12, Math.round(progressPercent * 0.9))}%`;

  return (
    <motion.div
      className="pipeline-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="pipeline-header">
        <div className="pipeline-header-left">
          <span className="pipeline-mini-label">DeployX production flow</span>
          <h2>Deployment Pipeline</h2>
          <p className="pipeline-description">
            12-stage production pipeline with real-time status tracking
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
          <strong>{currentStageLabel.replace("\n", " ")}</strong>
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
          let connectorState = "pending";
          if (index < steps.length - 1) {
            const current = stepStates[index];
            const next = stepStates[index + 1];
            if (current === "failed" || next === "failed") {
              connectorState = "failed";
            } else if (current === "done" && next === "done") {
              connectorState = "done";
            } else if (current === "active" || next === "active") {
              connectorState = "active";
            } else if (current === "done") {
              connectorState = "done";
            }
          }

          return (
            <React.Fragment key={step.key}>
              <motion.div
                className={`pipeline-step ${stepState}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
              >
                <div className="pipeline-node">{icon}</div>
                <div className="pipeline-label">{step.label}</div>
              </motion.div>
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
    </motion.div>
  );
}

export default DeploymentPipeline;