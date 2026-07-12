import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import MonitoringGrid from "./MonitoringGrid";
import MonitoringCharts from "./MonitoringCharts";
import HealthIndicator from "./HealthIndicator";
import EmptyMonitoringState from "./EmptyMonitoringState";
import API from "../../services/api";

function MiniProgressBar({ value, color, label }) {
  return (
    <div className="mini-progress-container">
      <div className="mini-progress-header">
        <span className="mini-progress-label">{label}</span>
        <span className="mini-progress-value">{value}%</span>
      </div>
      <div className="mini-progress-track">
        <motion.div
          className="mini-progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

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

  const cpuVal = metrics?.cpu ?? 0;
  const ramVal = metrics?.ram ?? 0;
  const rxVal = metrics?.network_rx ?? 0;
  const txVal = metrics?.network_tx ?? 0;

  return (
    <motion.div
      className="monitoring-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="monitoring-top">
        <div>
          <p className="monitoring-label">Live Container Monitoring</p>
          <h1>Realtime Metrics Dashboard</h1>
        </div>

        <HealthIndicator health={metrics?.health || "healthy"} />
      </div>

      {/* Mini Progress Bars */}
      <motion.div
        className="mini-progress-grid"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="mini-progress-card">
          <MiniProgressBar value={cpuVal} color="#DC2626" label="CPU Usage" />
        </div>
        <div className="mini-progress-card">
          <MiniProgressBar value={ramVal} color="#8B5CF6" label="RAM Usage" />
        </div>
        <div className="mini-progress-card">
          <MiniProgressBar value={Math.min(100, (rxVal / 100) * 100)} color="#38BDF8" label="Network RX" />
        </div>
        <div className="mini-progress-card">
          <MiniProgressBar value={Math.min(100, (txVal / 100) * 100)} color="#22C55E" label="Network TX" />
        </div>
      </motion.div>

      <MonitoringGrid
        metrics={metrics}
        deploymentInfo={deploymentInfo}
        deploymentCount={deploymentCount}
        activeServices={activeServices}
      />

      <MonitoringCharts cpuHistory={cpuHistory} ramHistory={ramHistory} networkHistory={networkHistory} />
    </motion.div>
  );
}

export default MonitoringPanel;