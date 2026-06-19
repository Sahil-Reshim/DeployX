import { useEffect, useState } from "react";
import MonitoringGrid from "./MonitoringGrid";
import MonitoringCharts from "./MonitoringCharts";
import HealthIndicator from "./HealthIndicator";
import EmptyMonitoringState from "./EmptyMonitoringState";
import API from "../../services/api";

import "../../styles/monitoring.css";

function MonitoringPanel({
  metrics,
  cpuHistory,
  ramHistory,
  networkHistory,
  deploymentStatus,
  deploymentId,
}) {
  const [deploymentInfo, setDeploymentInfo] = useState(null);
  const [deploymentCount, setDeploymentCount] = useState(0);
  const [activeServices, setActiveServices] = useState(0);

  const isInactive =
    !deploymentStatus ||
    [
      "queued",
      "cloning",
      "detecting",
      "dockerfile_generating",
      "ci_pipeline",
      "docker_build",
      "deploying",
      "failed",
    ].includes(deploymentStatus?.toLowerCase?.());

  useEffect(() => {
    async function loadDeployment() {
      try {
        if (!deploymentId) return;
        const res = await API.get(`/deployments/${deploymentId}/status`);
        if (res.data?.success) setDeploymentInfo(res.data.deployment);
      } catch (e) {
        // ignore
      }
    }

    async function loadCounts() {
      try {
        const res = await API.get(`/deployments`);
        if (res.data?.success) {
          const list = res.data.deployments || [];
          setDeploymentCount(list.length);
          setActiveServices(list.filter((d) => (d.status || "").toLowerCase() === "running").length);
        }
      } catch (e) {}
    }

    loadDeployment();
    loadCounts();
  }, [deploymentId]);

  if (isInactive) {
    return <EmptyMonitoringState />;
  }

  return (
    <div className="monitoring-panel">
      <div className="monitoring-top">
        <div>
          <p className="monitoring-label">Live Container Monitoring</p>
          <h1>Realtime Metrics Dashboard</h1>
        </div>

        <HealthIndicator health={metrics.health} />
      </div>

      <MonitoringGrid
        metrics={metrics}
        deploymentInfo={deploymentInfo}
        deploymentCount={deploymentCount}
        activeServices={activeServices}
      />

      <MonitoringCharts cpuHistory={cpuHistory} ramHistory={ramHistory} networkHistory={networkHistory} />
    </div>
  );
}

export default MonitoringPanel;
