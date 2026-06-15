import "../styles/jenkins.css";
function JenkinsPipeline({
  stages = [],
  buildNumber,
  status,
  currentStage
}) {

  return (

    <div className="jenkins-card">

      <div className="jenkins-header">

        <h2>Jenkins Pipeline</h2>

        <span
          className={`jenkins-status ${status?.toLowerCase()}`}
        >
          {status}
        </span>

      </div>

      <div className="build-meta">

        <div>
          Build #{buildNumber}
        </div>

        <div>
          Stage: {currentStage}
        </div>

      </div>

      <div className="pipeline-list">

        {stages.map((stage) => (

          <div
            key={stage.id}
            className={`pipeline-row ${stage.status}`}
          >

            <div className="pipeline-dot" />

            <div className="pipeline-name">
              {stage.name}
            </div>

            <div className="pipeline-state">
              {stage.status}
            </div>

          </div>

        ))}

      </div>

    </div>

  );

}

export default JenkinsPipeline;