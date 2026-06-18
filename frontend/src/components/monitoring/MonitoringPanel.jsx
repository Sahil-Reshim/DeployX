import MonitoringGrid from "./MonitoringGrid";
import MonitoringCharts from "./MonitoringCharts";
import HealthIndicator from "./HealthIndicator";
import EmptyMonitoringState from "./EmptyMonitoringState";

import "../../styles/monitoring.css";

function MonitoringPanel({
  metrics,
  cpuHistory,
  ramHistory,
  networkHistory,
  deploymentStatus
}) {

  const isInactive =
    !deploymentStatus ||
    ["queued", "cloning", "detecting", "dockerfile_generating", "ci_pipeline", "docker_build", "deploying", "failed"].includes(
      deploymentStatus?.toLowerCase?.()
    );

  if (isInactive) {

    return <EmptyMonitoringState />;

  }

  return (

    <div className="monitoring-panel">

      <div className="monitoring-top">

        <div>

          <p className="monitoring-label">
            Live Container Monitoring
          </p>

          <h1>
            Realtime Metrics Dashboard
          </h1>

        </div>

        <HealthIndicator
          health={metrics.health}
        />

      </div>

      <MonitoringGrid
        metrics={metrics}
      />

      <MonitoringCharts
        cpuHistory={cpuHistory}
        ramHistory={ramHistory}
        networkHistory={networkHistory}
      />

    </div>

  );

}

export default MonitoringPanel;