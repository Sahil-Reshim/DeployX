import React from "react";

function DeploymentPipeline({ status }) {

  const normalizedStatus =
    (status || "").toLowerCase();

  /*
    NEW BACKEND FLOW

    queued
    cloning
    detecting
    dockerfile_generating
    building
    deploying
    running
    failed
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

    failed: -1,
  };

  /*
    CURRENT STEP
  */

  const currentStep =
    normalizedStatus in statusOrder
      ? statusOrder[normalizedStatus]
      : -999;

  /*
    FAILED STEP INDEX
  */

  const failedStepIndex =
    currentStep === -1
      ? 4
      : currentStep;

  /*
    STEP STATE
  */

  const getStepState = (index) => {

    /*
      INITIAL
    */

    if (!normalizedStatus) {

      return "step-pending";

    }

    /*
      FAILED
    */

    if (
      normalizedStatus === "failed"
    ) {

      if (index < failedStepIndex) {

        return "step-done";

      }

      if (index === failedStepIndex) {

        return "step-failed";

      }

      return "step-pending";

    }

    /*
      RUNNING = EVERYTHING DONE
    */

    if (
      normalizedStatus === "running"
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
              ? normalizedStatus.replaceAll(
                  "_",
                  " "
                )
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