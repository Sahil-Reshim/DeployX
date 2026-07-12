import { useEffect, useMemo, useState } from "react";

import useDeployments from "../hooks/useDeployments";
import useMonitoring from "../hooks/useMonitoring";

import {
  DeploymentSocketProvider,
  useDeploymentSocketContext,
} from "../context/DeploymentSocketContext";

import Navbar from "../components/Navbar";
import RepoForm from "../components/RepoForm";
import DeploymentHistory from "../components/DeploymentHistory";
import ProductionLink from "../components/ProductionLink";
import LogsViewer from "../components/LogsViewer";
import DeploymentPipeline from "../components/DeploymentPipeline";
import MonitoringPanel from "../components/monitoring/MonitoringPanel";
import JenkinsPipeline from "../components/JenkinsPipeline";

import Analytics from "./Analytics";
import Settings from "./Settings";

import {
  buildJenkinsView,
  mergeDeploymentRecord,
  mergeSocketUpdate,
} from "../utils/deploymentMerge";

function DashboardContent({
  activePage,
  setActivePage,
  activeDeployment,
  setActiveDeployment,
  deployments,
  latestDeployment,
  upsertLatestDeployment,
  initialLoading,
  fetchDeployments,
  deleteDeployment,
  startDeployment,
  stopDeployment,
  restartDeployment,
  actionLoading,
  effectiveDeploymentId,
}) {
  const { statusData } = useDeploymentSocketContext();

  const displayDeployment = useMemo(() => {
    if (activeDeployment && latestDeployment && Number(activeDeployment.id) === Number(latestDeployment.id)) {
      return mergeDeploymentRecord(activeDeployment, latestDeployment);
    }
    return latestDeployment || activeDeployment;
  }, [activeDeployment, latestDeployment]);

  const jenkinsData = useMemo(() => buildJenkinsView(displayDeployment), [displayDeployment]);

  const { metrics, cpuHistory, ramHistory, networkHistory } = useMonitoring(statusData);

  const monitoringAvailable =
    (metrics?.cpu || 0) > 0 || (metrics?.ram || 0) > 0 || (metrics?.network_rx || 0) > 0 || (metrics?.network_tx || 0) > 0;

  useEffect(() => {
    if (!statusData?.deployment_id) return;
    upsertLatestDeployment((prev) => {
      if (prev && Number(prev.id) !== Number(statusData.deployment_id)) return prev;
      return mergeSocketUpdate(prev || { id: statusData.deployment_id }, statusData);
    });
    setActiveDeployment((prev) => {
      if (prev && Number(prev.id) !== Number(statusData.deployment_id)) return prev;
      return mergeSocketUpdate(prev || { id: statusData.deployment_id }, statusData);
    });
  }, [statusData, upsertLatestDeployment, setActiveDeployment]);

  const deploymentProgress = useMemo(() => Number(displayDeployment?.progress) || 0, [displayDeployment]);
  const isStepActive = (requiredProgress) => deploymentProgress >= requiredProgress;

  const deploymentName = useMemo(() => {
    if (!displayDeployment?.repo_url) return "GitHub Repository";
    return displayDeployment.repo_url.replace(".git", "").split("/").slice(-2).join("/");
  }, [displayDeployment]);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <>
            <section className="hero-section">
              <div className="hero-eyebrow">
                <span className="hero-eyebrow-dot"></span>
                Smart DevOps Platform
              </div>
              <h1>
                Deploy<span>X</span>
              </h1>
              <p className="hero-subtitle">
                Automated GitHub Deployments · Docker Runtime · Real-Time Logs & Smart Monitoring
              </p>
              <RepoForm
                refreshDeployments={fetchDeployments}
                setActiveDeployment={setActiveDeployment}
                upsertLatestDeployment={upsertLatestDeployment}
              />
            </section>

            {displayDeployment && (
              <div className="active-deployment-card glass-card">
                <div className="active-top">
                  <div>
                    <p className="active-label">Active Deployment</p>
                    <h2>{deploymentName}</h2>
                  </div>
                  <div className={`status-pill ${(displayDeployment?.state_key || displayDeployment?.status || "offline").toLowerCase()}`}>
                    {displayDeployment?.state_label || displayDeployment?.status || "Offline"}
                  </div>
                </div>
                <div className="progress-wrapper">
                  <div className="progress-info">
                    <span>Deployment Progress</span>
                    <span>{deploymentProgress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${(displayDeployment?.status || "").toLowerCase()}`}
                      style={{ width: `${deploymentProgress}%` }}
                    />
                  </div>
                </div>
                <div className="pipeline-mini" style={{ display: "flex", gap: "12px", marginTop: "16px", overflowX: "auto" }}>
                  {[
                    { label: "Queue", progress: 10 },
                    { label: "Clone", progress: 20 },
                    { label: "Detect", progress: 35 },
                    { label: "Dockerfile", progress: 50 },
                    { label: "CI", progress: 65 },
                    { label: "Build", progress: 80 },
                    { label: "Deploy", progress: 95 },
                    { label: "Live", progress: 100 },
                  ].map((step) => (
                    <span
                      key={step.label}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "10px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        background: isStepActive(step.progress) ? "var(--green-bg)" : "var(--glass-bg)",
                        border: `1px solid ${isStepActive(step.progress) ? "var(--green-border)" : "var(--border-secondary)"}`,
                        color: isStepActive(step.progress) ? "var(--green)" : "var(--text-muted)",
                        transition: "var(--transition-fast)",
                      }}
                    >
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="dashboard-grid">
              <div className="glass-card card-deployment-pipeline">
                <p className="glass-card-title">Deployment Pipeline</p>
                <DeploymentPipeline stateKey={displayDeployment?.state_key} progress={displayDeployment?.progress} />
              </div>

              <div className="glass-card card-production">
                <p className="glass-card-title">Production Deployment</p>
                <ProductionLink deployment={displayDeployment} />
              </div>

              <div className="glass-card card-jenkins">
                <p className="glass-card-title">CI/CD Pipeline</p>
                <JenkinsPipeline
                  stages={jenkinsData?.stages || []}
                  buildNumber={jenkinsData?.build_number}
                  status={jenkinsData?.status}
                  currentStage={jenkinsData?.current_stage}
                />
              </div>

              <div className="glass-card card-monitoring">
                <div className="monitoring-header">
                  <div>
                    <p className="glass-card-title">Live Infrastructure Monitoring</p>
                    <h2 className="monitoring-title">DeployX Runtime Metrics</h2>
                  </div>
                  <div className={`monitoring-live ${monitoringAvailable ? "live" : "offline"}`}>
                    <span className="live-dot"></span>
                    {monitoringAvailable ? "LIVE" : "WAITING"}
                  </div>
                </div>
                <div className="monitoring-stats-grid">
                  <div className="monitor-stat-card">
                    <span className="monitor-stat-label">CPU Usage</span>
                    <h1>{metrics?.cpu ?? 0}%</h1>
                  </div>
                  <div className="monitor-stat-card">
                    <span className="monitor-stat-label">RAM Usage</span>
                    <h1>{metrics?.ram ?? 0}%</h1>
                  </div>
                </div>
                <div className="network-activity">
                  <div className="network-box">
                    <span>Network RX</span>
                    <h3>{metrics?.network_rx ?? 0} KB/s</h3>
                  </div>
                  <div className="network-box">
                    <span>Network TX</span>
                    <h3>{metrics?.network_tx ?? 0} KB/s</h3>
                  </div>
                </div>
                <div className="runtime-status-card">
                  <div className="runtime-item">
                    <span>Deployment</span>
                    <strong>{displayDeployment?.status || "offline"}</strong>
                  </div>
                  <div className="runtime-item">
                    <span>Container</span>
                    <strong>{displayDeployment?.container_id ? "Attached" : "Detached"}</strong>
                  </div>
                </div>
                <div className="health-card">
                  <div className="health-pulse"></div>
                  <div>
                    <span className="health-label">System Health</span>
                    <h2>{monitoringAvailable ? metrics?.health || "healthy" : "Waiting for Metrics"}</h2>
                  </div>
                </div>
              </div>

              <div className="glass-card card-logs">
                <p className="glass-card-title">Live Deployment Logs</p>
                <LogsViewer deploymentId={effectiveDeploymentId} />
              </div>
            </div>

            <div className="history-section">
              <div className="section-header">
                <h1>Deployment History</h1>
                <div className="count-badge">{deployments?.length || 0} Deployments</div>
              </div>
              <DeploymentHistory
                deployments={deployments}
                loading={initialLoading}
                onDeleteDeployment={deleteDeployment}
                onRefresh={fetchDeployments}
                onStartDeployment={startDeployment}
                onStopDeployment={stopDeployment}
                onRestartDeployment={restartDeployment}
                actionLoading={actionLoading}
              />
            </div>
          </>
        );

      case "deployments":
        return (
          <div>
            <div className="section-header" style={{ marginTop: "24px" }}>
              <h1>All Deployments</h1>
              <div className="count-badge">{deployments?.length || 0} Deployments</div>
            </div>
            <DeploymentHistory
              deployments={deployments}
              loading={initialLoading}
              onDeleteDeployment={deleteDeployment}
              onRefresh={fetchDeployments}
              onStartDeployment={startDeployment}
              onStopDeployment={stopDeployment}
              onRestartDeployment={restartDeployment}
              actionLoading={actionLoading}
            />
          </div>
        );

      case "logs":
        return (
          <div>
            <div className="section-header" style={{ marginTop: "24px" }}>
              <h1>Deployment Engine Logs</h1>
            </div>
            <LogsViewer deploymentId={effectiveDeploymentId} />
          </div>
        );

      case "monitoring":
        return (
          <div style={{ marginTop: "24px" }}>
            <MonitoringPanel
              metrics={metrics}
              cpuHistory={cpuHistory}
              ramHistory={ramHistory}
              networkHistory={networkHistory}
              deploymentStatus={displayDeployment?.status}
              deploymentId={effectiveDeploymentId}
            />
          </div>
        );

      case "analytics":
        return <Analytics />;

      case "settings":
        return <Settings />;

      default:
        return null;
    }
  };

  return <div className="main-content">{renderPage()}</div>;
}

function Dashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [activeDeployment, setActiveDeployment] = useState(null);

  const {
    deployments,
    latestDeployment,
    upsertLatestDeployment,
    loading: initialLoading,
    fetchDeployments,
    deleteDeployment,
    startDeployment,
    stopDeployment,
    restartDeployment,
    actionLoading,
  } = useDeployments();

  const effectiveDeploymentId = activeDeployment?.id ?? latestDeployment?.id;

  return (
    <>
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      {initialLoading ? (
        <div className="loader-container" style={{ minHeight: "60vh" }}>
          <div className="loader-ring">
            <div className="loader-ring-outer"></div>
            <div className="loader-ring-inner"></div>
          </div>
          <p className="loader-text" style={{ marginTop: "16px" }}>Loading Deployments...</p>
        </div>
      ) : (
        <DeploymentSocketProvider deploymentId={effectiveDeploymentId}>
          <DashboardContent
            activePage={activePage}
            setActivePage={setActivePage}
            activeDeployment={activeDeployment}
            setActiveDeployment={setActiveDeployment}
            deployments={deployments}
            latestDeployment={latestDeployment}
            upsertLatestDeployment={upsertLatestDeployment}
            initialLoading={initialLoading}
            fetchDeployments={fetchDeployments}
            deleteDeployment={deleteDeployment}
            startDeployment={startDeployment}
            stopDeployment={stopDeployment}
            restartDeployment={restartDeployment}
            actionLoading={actionLoading}
            effectiveDeploymentId={effectiveDeploymentId}
          />
        </DeploymentSocketProvider>
      )}
    </>
  );
}

export default Dashboard;