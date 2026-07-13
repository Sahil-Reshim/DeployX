import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
            {/* ─── Hero Section ─── */}
            <section className="dash-hero-section">
              <div className="dash-hero-eyebrow">
                <span className="dash-hero-eyebrow-dot"></span>
                Smart DevOps Platform
              </div>
              <h1 className="dash-hero-title">
                Deploy<span>X</span>
              </h1>
              <p className="dash-hero-subtitle">
                Automated GitHub Deployments · Docker Runtime · Real-Time Logs & Smart Monitoring
              </p>
              <RepoForm
                refreshDeployments={fetchDeployments}
                setActiveDeployment={setActiveDeployment}
                upsertLatestDeployment={upsertLatestDeployment}
              />
            </section>

            {/* ─── Active Deployment ─── */}
            {displayDeployment && (
              <div className="dash-active-deployment glass-card">
                <div className="dash-active-top">
                  <div>
                    <p className="dash-active-label">Active Deployment</p>
                    <h2>{deploymentName}</h2>
                  </div>
                  <div className={`status-pill ${(displayDeployment?.state_key || displayDeployment?.status || "offline").toLowerCase()}`}>
                    {displayDeployment?.state_label || displayDeployment?.status || "Offline"}
                  </div>
                </div>
                <div className="dash-progress-wrapper">
                  <div className="dash-progress-info">
                    <span>Deployment Progress</span>
                    <span>{deploymentProgress}%</span>
                  </div>
                  <div className="dash-progress-bar">
                    <div
                      className={`dash-progress-fill ${(displayDeployment?.status || "").toLowerCase()}`}
                      style={{ width: `${deploymentProgress}%` }}
                    />
                  </div>
                </div>
                <div className="dash-pipeline-mini">
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
                      className={`dash-step-tag ${isStepActive(step.progress) ? "active" : ""}`}
                    >
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Deployment Overview Grid ─── */}
            <div className="dash-overview-grid">
              <div className="glass-card dash-card-deployment-pipeline">
                <p className="glass-card-title">Deployment Pipeline</p>
                <DeploymentPipeline stateKey={displayDeployment?.state_key} progress={displayDeployment?.progress} />
              </div>
              <div className="glass-card dash-card-production">
                <p className="glass-card-title">Production Deployment</p>
                <ProductionLink deployment={displayDeployment} />
              </div>
            </div>

            {/* ─── Monitoring + Logs Grid ─── */}
            <div className="dash-monitoring-grid">
              <div className="glass-card dash-card-jenkins">
                <p className="glass-card-title">CI/CD Pipeline</p>
                <JenkinsPipeline
                  stages={jenkinsData?.stages || []}
                  buildNumber={jenkinsData?.build_number}
                  status={jenkinsData?.status}
                  currentStage={jenkinsData?.current_stage}
                />
              </div>
              <div className="glass-card dash-card-monitoring">
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
            </div>

            {/* ─── Live Logs ─── */}
            <div className="dash-logs-section">
              <div className="glass-card dash-card-logs">
                <p className="glass-card-title">Live Deployment Logs</p>
                <LogsViewer deploymentId={effectiveDeploymentId} />
              </div>
            </div>

            {/* ─── Analytics Preview ─── */}
            <div className="dash-analytics-section">
              <Analytics />
            </div>

            {/* ─── Deployment History ─── */}
            <div className="dash-history-section">
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
          <div className="dash-page-section">
            <div className="section-header">
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
          <div className="dash-page-section">
            <div className="section-header">
              <h1>Deployment Engine Logs</h1>
            </div>
            <LogsViewer deploymentId={effectiveDeploymentId} />
          </div>
        );

      case "monitoring":
        return (
          <div className="dash-page-section">
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
        return <div className="dash-page-section"><Analytics /></div>;

      case "settings":
        return <div className="dash-page-section"><Settings /></div>;

      default:
        return null;
    }
  };

  return <div className="main-content">{renderPage()}</div>;
}

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
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
      <div className="bg-container">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-grid"></div>
      </div>
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