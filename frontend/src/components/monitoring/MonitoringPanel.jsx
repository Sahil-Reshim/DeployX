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
  const [restMetrics, setRestMetrics] = useState(null);
  const [restHistory, setRestHistory] = useState({ cpu: [], ram: [], network: [] });

const isInactive =
    !deploymentStatus &&
    !metrics?.cpu &&
    !metrics?.ram &&
    !metrics?.network_rx &&
    !metrics?.network_tx;

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

  // REST polling fallback — keeps monitoring live even if the
  // socket stream was missed (e.g. page opened after deployment).
  useEffect(() => {
    if (!deploymentId) return undefined;
    let cancelled = false;

    async function pollMetrics() {
      try {
        const res = await API.get(`/deployments/${deploymentId}/metrics`);
        const list = res.data?.metrics || [];
        if (cancelled || !list.length) return;
        const latest = list[list.length - 1];
        setRestMetrics({
          cpu: Number(latest.cpu) || 0,
          ram: Number(latest.ram) || 0,
          network_rx: Number(latest.network_rx) || 0,
          network_tx: Number(latest.network_tx) || 0,
          health: metrics?.health || "healthy",
        });
        setRestHistory({
          cpu: list.map((m) => ({ time: m.timestamp, value: Number(m.cpu) || 0 })),
          ram: list.map((m) => ({ time: m.timestamp, value: Number(m.ram) || 0 })),
          network: list.map((m) => ({
            time: m.timestamp,
            rx: Number(m.network_rx) || 0,
            tx: Number(m.network_tx) || 0,
          })),
        });
      } catch (e) {
        // ignore — endpoint may be unavailable
      }
    }

    pollMetrics();
    const interval = setInterval(pollMetrics, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [deploymentId]);

  if (isInactive) {
    return <EmptyMonitoringState />;
  }

  // Prefer live socket metrics; fall back to REST-polled metrics
  const hasSocketData =
    (metrics?.cpu || 0) > 0 ||
    (metrics?.ram || 0) > 0 ||
    (metrics?.network_rx || 0) > 0 ||
    (metrics?.network_tx || 0) > 0 ||
    (metrics?.health === "unavailable" && !restMetrics);
  const effMetrics = hasSocketData || metrics?.health === "unavailable"
      ? metrics
      : restMetrics || metrics;
  const effCpuHistory = cpuHistory.length ? cpuHistory : restHistory.cpu;
  const effRamHistory = ramHistory.length ? ramHistory : restHistory.ram;
  const effNetworkHistory = networkHistory.length ? networkHistory : restHistory.network;

  const cpuVal = effMetrics?.cpu ?? 0;
  const ramVal = effMetrics?.ram ?? 0;
  const rxVal = effMetrics?.network_rx ?? 0;
  const txVal = effMetrics?.network_tx ?? 0;

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

        <HealthIndicator health={effMetrics?.health || metrics?.health || "healthy"} />
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
        metrics={effMetrics}
        deploymentInfo={deploymentInfo}
        deploymentCount={deploymentCount}
        activeServices={activeServices}
      />

      <MonitoringCharts cpuHistory={effCpuHistory} ramHistory={effRamHistory} networkHistory={effNetworkHistory} />
    </motion.div>
  );
}

export default MonitoringPanel;