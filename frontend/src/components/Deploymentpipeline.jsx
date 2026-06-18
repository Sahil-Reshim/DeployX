import React from "react";

function DeploymentPipeline({ status }) {
  const normalizedStatus =
    status?.toLowerCase()?.trim() || "";

  const isWaiting = !normalizedStatus;

  const steps = [
    {
      key: "queued",
      icon: "⏳",
      label: "Queued",
      sublabel: "Request received",
    },
    {
      key: "cloning",
      icon: "📂",
      label: "Clone",
      sublabel: "Fetching repository",
    },
    {
      key: "detecting",
      icon: "🧠",
      label: "Detect",
      sublabel: "Checking framework",
    },
    {
      key: "dockerfile_generating",
      icon: "📝",
      label: "Dockerfile",
      sublabel: "Generating config",
    },
    {
      key: "ci_pipeline",
      icon: "🔧",
      label: "CI Pipeline",
      sublabel: "Running Jenkins",
    },
    {
      key: "docker_build",
      icon: "🐳",
      label: "Build",
      sublabel: "Building image",
    },
    {
      key: "deploying",
      icon: "⚡",
      label: "Deploy",
      sublabel: "Starting runtime",
    },
    {
      key: "running",
      icon: "🌍",
      label: "Live",
      sublabel: "Deployment online",
    },
  ];

  const statusOrder = {
    queued: 0,
    cloning: 1,
    detecting: 2,
    dockerfile_generating: 3,
    ci_pipeline: 4,
    docker_build: 5,
    deploying: 6,
    running: 7,
    success: 7,
    completed: 7,
    live: 7,
    stopped: 7,
    failed: 5,
  };

  const currentStep =
    normalizedStatus in statusOrder
      ? statusOrder[normalizedStatus]
      : -1;

  const getStepState = (index) => {
    if (normalizedStatus === "failed") {
      if (index < currentStep) {
        return "done";
      }

      if (index === currentStep) {
        return "failed";
      }

      return "pending";
    }

    if (index < currentStep) {
      return "done";
    }

    if (index === currentStep) {
      return "active";
    }

    return "pending";
  };

  const statusLabel = normalizedStatus
    ? normalizedStatus.replaceAll("_", " ")
    : "waiting";

  const footerMessage = (() => {
    switch (normalizedStatus) {
      case "running":
      case "success":
      case "completed":
      case "live":
        return (
          <div className="pipeline-success-message">
            Deployment completed successfully.
          </div>
        );
      case "failed":
        return (
          <div className="pipeline-failed-message">
            Deployment failed.
          </div>
        );
      case "stopped":
        return (
          <div className="pipeline-progress-message">
            Deployment is stopped.
          </div>
        );
      default:
        return (
          <div className="pipeline-progress-message">
            Deployment is running...
          </div>
        );
    }
  })();

  return (
    <div className="pipeline-section">
      <div className="pipeline-header">
        <div className="pipeline-header-left">
          <p className="pipeline-mini-label">
            DEPLOYX FLOW
          </p>

          <h2>Deployment Pipeline</h2>

          <p className="pipeline-description">
            Real-time deployment monitoring.
          </p>
        </div>

        <div
          className={`pipeline-status ${
            normalizedStatus || "idle"
          }`}
        >
          <span className="pipeline-status-dot"></span>
          <span>{statusLabel}</span>
        </div>
      </div>

      {isWaiting && (
        <div className="pipeline-empty">
          <div className="pipeline-empty-icon">🚀</div>
          <h3>Waiting For Deploy</h3>
          <p>Click deploy to start the deployment pipeline.</p>
        </div>
      )}

      {!isWaiting && (
        <>
          <div className="pipeline-steps">
            {steps.map((step, index) => {
              const state = getStepState(index);

              return (
                <div
                  key={step.key}
                  className={`pipeline-step step-${state}`}
                  style={{
                    animationDelay: `${index * 0.06}s`,
                  }}
                >
                  <div className="pipeline-step-glow"></div>

                  <div className="pipeline-icon">
                    {step.icon}
                  </div>

                  <div className="pipeline-content">
                    <div className="pipeline-label">
                      {step.label}
                    </div>
                    <div className="pipeline-sublabel">
                      {step.sublabel}
                    </div>
                  </div>

                  {state === "active" && (
                    <div className="pipeline-active-dot"></div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pipeline-footer">
            {footerMessage}
          </div>
        </>
      )}
    </div>
  );
}

export default DeploymentPipeline;
