import React from "react";

function DeploymentPipeline({ status }) {

  /*
    NORMALIZE STATUS
  */

  const normalizedStatus =
    status?.toLowerCase()?.trim() || "";

  /*
    WAITING STATE
  */

  const isWaiting =
    !normalizedStatus;

  /*
    PIPELINE STEPS
  */

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
      label: "Docker",
      sublabel: "Generating config",
    },

    {
      key: "building",
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
    STEP STATE
  */

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

  /*
    STATUS LABEL
  */

  const statusLabel =
    normalizedStatus
      ? normalizedStatus.replaceAll("_", " ")
      : "waiting";

  return (

    <div className="pipeline-section">

      {/* HEADER */}

      <div className="pipeline-header">

        <div className="pipeline-header-left">

          <p className="pipeline-mini-label">
            DEPLOYX FLOW
          </p>

          <h2>
            Deployment Pipeline
          </h2>

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

          <span>
            {statusLabel}
          </span>

        </div>

      </div>

      {/* WAITING STATE */}

      {isWaiting && (

        <div className="pipeline-empty">

          <div className="pipeline-empty-icon">
            🚀
          </div>

          <h3>
            Waiting For Deploy
          </h3>

          <p>
            Click deploy to start the
            deployment pipeline.
          </p>

        </div>

      )}

      {/* PIPELINE */}

      {!isWaiting && (

        <>
          <div className="pipeline-steps">

            {steps.map((step, index) => {

              const state =
                getStepState(index);

              return (

                <div
                  key={step.key}
                  className={`pipeline-step step-${state}`}
                  style={{
                    animationDelay:
                      `${index * 0.06}s`,
                  }}
                >

                  <div className="pipeline-step-glow"></div>

                  {/* ICON */}

                  <div className="pipeline-icon">

                    {step.icon}

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

                  {/* ACTIVE DOT */}

                  {state === "active" && (

                    <div className="pipeline-active-dot"></div>

                  )}

                </div>

              );
            })}

          </div>

          {/* FOOTER */}

          <div className="pipeline-footer">

            {normalizedStatus === "running" ||
            normalizedStatus === "success" ||
            normalizedStatus === "live" ? (

              <div className="pipeline-success-message">

                Deployment completed successfully.

              </div>

            ) : normalizedStatus === "failed" ? (

              <div className="pipeline-failed-message">

                Deployment failed during build.

              </div>

            ) : (

              <div className="pipeline-progress-message">

                Deployment is running...

              </div>

            )}

          </div>

        </>

      )}

    </div>

  );
}

export default DeploymentPipeline;