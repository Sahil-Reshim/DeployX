import "../styles/jenkins.css";
import {
  formatJenkinsStageName,
  stageSlug,
} from "../utils/deploymentMerge";

function JenkinsPipeline({
  stages = [],
  buildNumber,
  status = "QUEUED",
  currentStage = "Waiting...",
}) {
  const normalizedCurrent = stageSlug(currentStage);
  const displayStage = formatJenkinsStageName(currentStage);

  return (
    <div className="jenkins-card">
      <div className="jenkins-header">
        <h2>Jenkins Pipeline</h2>

        <span
          className={`jenkins-status ${
            status?.toLowerCase() || "queued"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="build-meta">
        <div>
          Build #{buildNumber || "--"}
        </div>

        <div>
          Stage: {displayStage}
        </div>
      </div>

      <div className="pipeline-list">
        {stages.length === 0 ? (
          <div className="pipeline-empty">
            No stage information available
          </div>
        ) : (
          stages.map((stage, index) => {
            const isActive =
              stageSlug(stage.name) === normalizedCurrent ||
              stage.status === "IN_PROGRESS";

            return (
              <div
                key={`${stage.name}-${index}`}
                className={`pipeline-row ${
                  isActive
                    ? "in_progress"
                    : stage.status?.toLowerCase()
                }`}
              >
                <div className="pipeline-dot" />

                <div className="pipeline-name">
                  {stage.name}
                </div>

                <div className="pipeline-state">
                  {stage.status}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default JenkinsPipeline;
