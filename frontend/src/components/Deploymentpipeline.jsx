import React from "react";

function DeploymentPipeline({ status }) {

  /*
    NORMALIZE STATUS
  */

  const normalizedStatus =
    (status || "").toLowerCase();

  /*
    PIPELINE STEPS
  */

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
        "Fetching repository from GitHub",
    },

    {
      key: "detecting",
      icon: "🧠",
      label: "Framework Detection",
      sublabel:
        "Analyzing application structure",
    },

    {
      key: "dockerfile_generating",
      icon: "📝",
      label: "Dockerfile Generation",
      sublabel:
        "Preparing container environment",
    },

    {
      key: "building",
      icon: "🐳",
      label: "Docker Image Build",
      sublabel:
        "Building deployment container",
    },

    {
      key: "deploying",
      icon: "⚡",
      label: "Container Deployment",
      sublabel:
        "Starting production runtime",
    },

    {
      key: "running",
      icon: "🌍",
      label: "Deployment Live",
      sublabel:
        "Production URL generated successfully",
    },
  ];

  /*
    STATUS ORDER
  */

  const statusOrder = {

    queued: 0,

    cloning: 1,

    detecting: 2,

    dockerfile_generating: 3,

    building: 4,

    deploying: 5,

    running: 6,

    success: 6,

    live: 6,

    completed: 6,

    failed: 4,
  };

  /*
    CURRENT STEP
  */

  const currentStep =
    normalizedStatus in statusOrder
      ? statusOrder[normalizedStatus]
      : -1;

  /*
    STEP STATES
  */

  const getStepState = (
    index
  ) => {

    /*
      NO STATUS
    */

    if (!normalizedStatus) {
      return "idle";
    }

    /*
      FAILED STATE
    */

    if (
      normalizedStatus ===
      "failed"
    ) {

      if (index < currentStep) {
        return "done";
      }

      if (index === currentStep) {
        return "failed";
      }

      return "idle";
    }

    /*
      COMPLETED
    */

    if (index < currentStep) {
      return "done";
    }

    /*
      ACTIVE
    */

    if (index === currentStep) {
      return "active";
    }

    /*
      FUTURE STEP
    */

    return "idle";
  };

  /*
    STATUS LABEL
  */

  const statusLabel =
    normalizedStatus
      ? normalizedStatus.replaceAll(
          "_",
          " "
        )
      : "waiting";

  return (

    <div className="pipeline-section">

      {/* BACKGROUND GLOW */}

      <div className="pipeline-background-glow"></div>

      {/* HEADER */}

      <div className="pipeline-header">

        <div className="pipeline-header-left">

          <p className="pipeline-mini-label">
            LIVE DEPLOYMENT FLOW
          </p>

          <h2>
            Deployment Pipeline
          </h2>

          <p className="pipeline-description">

            Real-time CI/CD deployment
            visualization powered by
            DeployX runtime engine.

          </p>

        </div>

        <div
          className={`pipeline-status ${
            normalizedStatus || "idle"
          }`}
        >

          <span className="pipeline-status-dot"></span>

          <span className="pipeline-status-text">

            {statusLabel}

          </span>

        </div>

      </div>

      {/* EMPTY STATE */}

      {!normalizedStatus && (

        <div className="pipeline-empty">

          <div className="pipeline-empty-glow"></div>

          <div className="pipeline-empty-icon">

            🚀

          </div>

          <h3>
            Waiting For Deployment
          </h3>

          <p>

            Deploy a GitHub repository
            to start the real-time
            deployment pipeline.

          </p>

        </div>

      )}

      {/* PIPELINE */}

      {normalizedStatus && (

        <div className="pipeline-steps">

          {steps.map(
            (step, index) => {

              const state =
                getStepState(index);

              const isLast =
                index ===
                steps.length - 1;

              return (

                <div
                  key={step.key}
                  className={`pipeline-step ${state}`}
                  style={{
                    animationDelay:
                      `${index * 0.08}s`,
                  }}
                >

                  {/* CONNECTION LINE */}

                  {!isLast && (

                    <div
                      className={`pipeline-line ${state}`}
                    ></div>

                  )}

                  {/* STEP GLOW */}

                  <div className="pipeline-step-glow"></div>

                  {/* ICON */}

                  <div
                    className={`pipeline-icon ${state}`}
                  >

                    <span>
                      {step.icon}
                    </span>

                  </div>

                  {/* CONTENT */}

                  <div className="pipeline-content">

                    <div className="pipeline-label">

                      {step.label}

                    </div>

                    <div className="pipeline-sublabel">

                      {step.sublabel}

                    </div>

                  </div>

                  {/* ACTIVE PULSE */}

                  {state ===
                    "active" && (

                    <div className="pipeline-active-pulse"></div>

                  )}

                </div>

              );
            }
          )}

        </div>

      )}

      {/* FOOTER */}

      {normalizedStatus && (

        <div className="pipeline-footer">

          {normalizedStatus ===
            "running" ||
          normalizedStatus ===
            "success" ||
          normalizedStatus ===
            "live" ? (

            <div className="pipeline-success-message">

              Deployment completed successfully.

            </div>

          ) : normalizedStatus ===
            "failed" ? (

            <div className="pipeline-failed-message">

              Deployment failed during
              build process.

            </div>

          ) : (

            <div className="pipeline-progress-message">

              Deployment pipeline is
              currently executing...

            </div>

          )}

        </div>

      )}

    </div>

  );
}

export default DeploymentPipeline;