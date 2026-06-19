import "../styles/jenkins.css";
import {
  formatJenkinsStageName,
  stageSlug,
} from "../utils/deploymentMerge";

const TIMELINE_STEPS = [
  { key: "queue", label: "Queue" },
  { key: "clone", label: "Clone" },
  { key: "detect", label: "Detect" },
  { key: "build", label: "Build" },
  { key: "test", label: "Test" },
  { key: "docker", label: "Docker" },
  { key: "deploy", label: "Deploy" },
  { key: "verify", label: "Verify" },
  { key: "live", label: "Live" },
];

const STATUS_SUCCESS = new Set([
  "SUCCESS",
  "SUCCEEDED",
  "COMPLETED",
  "FINISHED",
  "PASSED",
]);
const STATUS_FAILED = new Set([
  "FAILED",
  "FAILURE",
  "ERROR",
  "ABORTED",
  "CANCELLED",
]);

function JenkinsPipeline({
  stages = [],
  buildNumber,
  status = "PENDING",
  currentStage = "Waiting...",
  buildName = "Jenkins CI Build",
  duration,
  queueTime,
}) {
  const normalizedCurrent = stageSlug(currentStage);
  const statusKey = String(status || "PENDING").toUpperCase();

  const stageMap = new Map(
    stages.map((stage) => [stageSlug(stage.name), stage.status || "PENDING"])
  );

  const stepStates = TIMELINE_STEPS.map((step) => {
    const stageStatus = String(stageMap.get(step.key) || "PENDING").toUpperCase();
    const isCurrent = normalizedCurrent === step.key;

    if (STATUS_FAILED.has(stageStatus)) {
      return "failed";
    }

    if (isCurrent || stageStatus === "IN_PROGRESS") {
      return "active";
    }

    if (STATUS_SUCCESS.has(stageStatus)) {
      return "completed";
    }

    return "pending";
  });

  const completedCount = stepStates.filter((state) => state === "completed").length;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((completedCount / TIMELINE_STEPS.length) * 100))
  );

  const formattedDuration = duration || "-";
  const formattedQueue = queueTime || "-";
  const lastUpdate = statusKey === "SUCCESS" ? "Complete" : statusKey === "FAILED" ? "Failed" : "Now";
  const successRate = statusKey === "SUCCESS" ? "100%" : statusKey === "FAILED" ? "0%" : `${Math.max(18, Math.round(progressPercent * 0.82))}%`;

  return (
    <div className="jenkins-horizontal-card">
      <div className="jenkins-metrics-row">
        <div className="jenkins-top-card">
          <span>Build</span>
          <strong>#{buildNumber ?? "--"}</strong>
        </div>
        <div className="jenkins-top-card">
          <span>Status</span>
          <strong className={`jenkins-status-pill ${statusKey.toLowerCase()}`}>
            {statusKey}
          </strong>
        </div>
        <div className="jenkins-top-card">
          <span>Current Stage</span>
          <strong>{formatJenkinsStageName(currentStage)}</strong>
        </div>
        <div className="jenkins-top-card">
          <span>Progress</span>
          <strong>{progressPercent}%</strong>
        </div>
      </div>

      <div className="jenkins-timeline-row">
        {TIMELINE_STEPS.map((step, index) => {
          const state = stepStates[index];
          const icon =
            state === "completed"
              ? "✓"
              : state === "active"
              ? "●"
              : state === "failed"
              ? "✕"
              : "○";
          const nextState = stepStates[index + 1];
          const connectorClass =
            index === TIMELINE_STEPS.length - 1
              ? ""
              : nextState === "failed"
              ? "failed"
              : state === "completed"
              ? "completed"
              : "pending";

          return (
            <div className="timeline-step-wrapper" key={step.key}>
              <div className={`timeline-step ${state}`}>
                <div className="timeline-node">{icon}</div>
                <div className={`timeline-label ${state}`}>{step.label}</div>
              </div>
              {index < TIMELINE_STEPS.length - 1 && (
                <div className={`timeline-connector ${connectorClass}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="jenkins-bottom-row">
        <div className="jenkins-bottom-card">
          <span>Duration</span>
          <strong>{formattedDuration}</strong>
        </div>
        <div className="jenkins-bottom-card">
          <span>Queue Time</span>
          <strong>{formattedQueue}</strong>
        </div>
        <div className="jenkins-bottom-card">
          <span>Last Update</span>
          <strong>{lastUpdate}</strong>
        </div>
        <div className="jenkins-bottom-card">
          <span>Success Rate</span>
          <strong>{successRate}</strong>
        </div>
      </div>
    </div>
  );
}

export default JenkinsPipeline;
