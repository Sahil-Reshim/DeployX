import React from "react";

function DeploymentPipeline({ status }) {

  const normalizedStatus =
    (status || "").toLowerCase();

  const steps = [

    {
      key: "queued",
      icon: "⏳",
      label: "Deployment Queued",
      sublabel:
        "Deployment request received",
    },

    {
      key: "cloning",
      icon: "📂",
      label: "Repository Cloned",
      sublabel:
        "Fetching source from GitHub",
    },

    {
      key: "detecting",
      icon: "🧠",
      label: "Framework Detection",
      sublabel:
        "Analyzing project structure",
    },

    {
      key: "dockerfile_generating",
      icon: "📝",
      label: "Dockerfile Generated",
      sublabel:
        "Preparing container configuration",
    },

    {
      key: "building",
      icon: "🐳",
      label: "Docker Build",
      sublabel:
        "Building deployment image",
    },

    {
      key: "deploying",
      icon: "⚡",
      label: "Container Deployment",
      sublabel:
        "Starting runtime environment",
    },

    {
      key: "running",
      icon: "🌍",
      label: "Deployment Live",
      sublabel:
        "Production URL generated",
    },
  ];

  const statusOrder = {

    queued: 0,

    cloning: 1,

    detecting: 2,

    dockerfile_generating: 3,

    building: 4,

    deploying: 5,

    running: 6,

    failed: 4,
  };

  const currentStep =
    normalizedStatus in statusOrder
      ? statusOrder[normalizedStatus]
      : -1;

  const getStepState = (index) => {

    if (!normalizedStatus) {
      return "hidden";
    }

    if (
      normalizedStatus === "failed"
    ) {

      if (index < currentStep) {
        return "done";
      }

      if (index === currentStep) {
        return "failed";
      }

      return "hidden";
    }

    if (index < currentStep) {
      return "done";
    }

    if (index === currentStep) {
      return "active";
    }

    return "hidden";
  };

  return (

    <div className="pipeline-section">

      <div className="pipeline-header">

        <div>

          <p className="pipeline-mini-label">
            LIVE DEPLOYMENT FLOW
          </p>

          <h2>
            Deployment Pipeline
          </h2>

        </div>

        <div
          className={`pipeline-status ${
            normalizedStatus || "idle"
          }`}
        >

          <span className="pipeline-status-dot"></span>

          {
            normalizedStatus
              ? normalizedStatus.replaceAll(
                  "_",
                  " "
                )
              : "waiting"
          }

        </div>

      </div>

      {/* INITIAL EMPTY BOX */}

      {!normalizedStatus && (

        <div className="pipeline-empty">

          <div className="pipeline-empty-icon">
            🚀
          </div>

          <h3>
            Waiting For Deployment
          </h3>

          <p>
            Start deploying a GitHub repository
            to begin the pipeline flow.
          </p>

        </div>

      )}

      {/* PIPELINE STEPS */}

      {normalizedStatus && (

        <div className="pipeline-steps">

          {steps.map((step, index) => {

            const state =
              getStepState(index);

            if (state === "hidden") {
              return null;
            }

            return (

              <div
                key={step.key}
                className={`pipeline-step ${state}`}
                style={{
                  animationDelay: `${index * 0.08}s`
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

              </div>

            );

          })}

        </div>

      )}

    </div>

  );
}

export default DeploymentPipeline;