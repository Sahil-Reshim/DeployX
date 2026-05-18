import React from "react";

function DeploymentPipeline({ status }) {

  /*
    IMPORTANT:
    - null / undefined / "" => NO ACTIVE STEP
    - deployment starts ONLY after backend sends status
  */

  const normalizedStatus =
    (status || "").toLowerCase();

  const steps = [
    {
      key: "cloning",
      icon: "📂",
      label: "Repository Cloned",
      sublabel: "Fetching source from GitHub",
    },
    {
      key: "building",
      icon: "🧠",
      label: "Framework Detected",
      sublabel: "Analyzing project structure",
    },
    {
      key: "deploying",
      icon: "🐳",
      label: "Docker Build",
      sublabel: "Building deployment image",
    },
    {
      key: "running",
      icon: "⚡",
      label: "Container Started",
      sublabel: "Starting runtime environment",
    },
    {
      key: "live",
      icon: "🌍",
      label: "Deployment Live",
      sublabel: "Production URL generated",
    },
  ];

  /*
    FLOW:
    cloning -> building -> deploying -> running -> live
  */

  const statusOrder = {
    cloning: 0,
    building: 1,
    deploying: 2,
    running: 3,
    success: 4,
    live: 4,
    failed: -1,
  };

  /*
    BEFORE DEPLOY CLICK:
    currentStep = -999
    => ALL PENDING / OFF
  */

  const currentStep =
    normalizedStatus
      ? (statusOrder[normalizedStatus] ?? -999)
      : -999;

  const getStepState = (index) => {

    /*
      INITIAL STATE
      Everything OFF
    */

    if (!normalizedStatus) {
      return "step-pending";
    }

    /*
      FAILED STATE
    */

    if (normalizedStatus === "failed") {

      if (index < currentStep) {
        return "step-done";
      }

      if (index === currentStep) {
        return "step-failed";
      }

      return "step-pending";
    }

    /*
      SUCCESS / LIVE
    */

    if (
      normalizedStatus === "success" ||
      normalizedStatus === "live"
    ) {
      return "step-done";
    }

    /*
      NORMAL FLOW
    */

    if (index < currentStep) {
      return "step-done";
    }

    if (index === currentStep) {
      return "step-active";
    }

    return "step-pending";
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
              ? normalizedStatus
              : "idle"
          }

        </div>

      </div>

      <div className="pipeline-steps">

        {steps.map((step, i) => (

          <div
            key={step.key}
            className={`pipeline-step ${getStepState(i)}`}
            style={{
              animationDelay: `${i * 0.08}s`
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

        ))}

      </div>

    </div>

  );
}

export default DeploymentPipeline;