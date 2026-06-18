import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

import {
  buildJenkinsView,
  mergeDeploymentRecord,
  mergeSocketUpdate,
} from "../utils/deploymentMerge";

import "../styles/dashboard.css";
import "../styles/navbar.css";
import "../styles/deployment.css";
import "../styles/logs.css";
import "../styles/animations.css";


function ComingSoon({ title }) {
  return (
    <section className="deployment-ui page-spacing">
      <div className="section-header">
        <h1>{title}</h1>
        <div className="count-badge">Coming Soon</div>
      </div>
    </section>
  );
}


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
    if (
      activeDeployment &&
      latestDeployment &&
      Number(activeDeployment.id) ===
        Number(latestDeployment.id)
    ) {
      return mergeDeploymentRecord(
        activeDeployment,
        latestDeployment
      );
    }

    return latestDeployment || activeDeployment;
  }, [activeDeployment, latestDeployment]);

  const jenkinsData = useMemo(
    () => buildJenkinsView(displayDeployment),
    [displayDeployment]
  );

  const { metrics, cpuHistory, ramHistory, networkHistory } =
    useMonitoring(statusData);

  const monitoringAvailable =
    (metrics?.cpu || 0) > 0 ||
    (metrics?.ram || 0) > 0 ||
    (metrics?.network_rx || 0) > 0 ||
    (metrics?.network_tx || 0) > 0;

  useEffect(() => {
    if (!statusData?.deployment_id) {
      return;
    }

    upsertLatestDeployment((prev) => {
      if (
        prev &&
        Number(prev.id) !==
          Number(statusData.deployment_id)
      ) {
        return prev;
      }

      const base =
        prev || { id: statusData.deployment_id };

      return mergeSocketUpdate(base, statusData);
    });

    setActiveDeployment((prev) => {
      if (
        prev &&
        Number(prev.id) !==
          Number(statusData.deployment_id)
      ) {
        return prev;
      }

      const base =
        prev || { id: statusData.deployment_id };

      return mergeSocketUpdate(base, statusData);
    });
  }, [statusData, upsertLatestDeployment, setActiveDeployment]);

  const deploymentProgress = useMemo(() => {
    if (!displayDeployment) {
      return 0;
    }

    const status = displayDeployment?.status
      ?.toLowerCase()
      ?.trim();

    switch (status) {
      case "queued":
        return 10;
      case "cloning":
        return 20;
      case "detecting":
        return 35;
      case "dockerfile_generating":
        return 50;
      case "ci_pipeline":
        return 65;
      case "docker_build":
        return 80;
      case "deploying":
        return 95;
      case "running":
      case "completed":
      case "live":
      case "success":
        return 100;
      case "failed":
        return 100;
      case "stopped":
        return 100;
      default:
        return 0;
    }
  }, [displayDeployment]);

  const isStepActive = (requiredProgress) =>
    deploymentProgress >= requiredProgress;

  const deploymentName = useMemo(() => {
    if (!displayDeployment?.repo_url) {
      return "GitHub Repository";
    }

    return displayDeployment.repo_url
      .replace(".git", "")
      .split("/")
      .slice(-2)
      .join("/");
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
                Automated GitHub Deployments,
                Docker Runtime,
                Real-Time Logs &
                Smart DevOps Monitoring
              </p>

              <RepoForm
                refreshDeployments={fetchDeployments}
                setActiveDeployment={setActiveDeployment}
                upsertLatestDeployment={upsertLatestDeployment}
              />
            </section>

            <section className="deployment-ui">
              {displayDeployment && (
                <div className="active-deployment-card">
                  <div className="active-top">
                    <div>
                      <p className="active-label">
                        Active Deployment
                      </p>
                      <h2>{deploymentName}</h2>
                    </div>

                    <div
                      className={`status-pill ${
                        displayDeployment?.status?.toLowerCase() ||
                        "offline"
                      }`}
                    >
                      {displayDeployment?.status || "offline"}
                    </div>
                  </div>

                  <div className="progress-wrapper">
                    <div className="progress-info">
                      <span>Deployment Progress</span>
                      <span>{deploymentProgress}%</span>
                    </div>

                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${
                          displayDeployment?.status?.toLowerCase()
                        }`}
                        style={{
                          width: `${deploymentProgress}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pipeline-mini">
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
                      <div
                        key={step.label}
                        className={`pipeline-step ${
                          isStepActive(step.progress)
                            ? "active"
                            : ""
                        }`}
                      >
                        {step.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="dashboard-grid">
                <div className="grid-left">
                  <div className="section-block">
                    <p className="section-title">
                      Deployment Pipeline
                    </p>
                    <DeploymentPipeline
                      status={displayDeployment?.status}
                    />
                  </div>

                  <div className="section-block jenkins-card">
                    <div className="jenkins-card-header">
                      <div className="jenkins-header-left">
                        <span className="jenkins-mini">
                          Continuous Integration
                        </span>
                        <h2 className="jenkins-title">
                          Build #
                          {jenkinsData?.build_number ?? "--"}
                        </h2>
                        <p className="jenkins-subtitle">
                          Automated Jenkins CI/CD Execution
                        </p>
                      </div>

                      <div
                        className={`jenkins-status ${
                          jenkinsData?.status?.toLowerCase() ||
                          "pending"
                        }`}
                      >
                        {jenkinsData?.status || "PENDING"}
                      </div>
                    </div>

                    <JenkinsPipeline
                      stages={jenkinsData?.stages || []}
                      buildNumber={jenkinsData?.build_number}
                      status={jenkinsData?.status}
                      currentStage={jenkinsData?.current_stage}
                    />
                  </div>
                </div>

                <div className="grid-right">
                  <div className="section-block">
                    <p className="section-title">
                      Production Deployment
                    </p>
                    <ProductionLink
                      deployment={displayDeployment}
                    />
                  </div>

                  <div className="section-block monitoring-preview-card">
                    <div className="monitoring-header">
                      <div>
                        <p className="section-title">
                          Live Infrastructure Monitoring
                        </p>
                        <h2 className="monitoring-title">
                          DeployX Runtime Metrics
                        </h2>
                      </div>

                      <div
                        className={`monitoring-live ${
                          monitoringAvailable ? "live" : "offline"
                        }`}
                      >
                        <span className="live-dot"></span>
                        {monitoringAvailable ? "LIVE" : "WAITING"}
                      </div>
                    </div>

                    <div className="monitoring-stats-grid">
                      <div className="monitor-stat-card">
                        <span className="monitor-stat-label">
                          CPU Usage
                        </span>
                        <h1>{metrics?.cpu ?? 0}%</h1>
                      </div>

                      <div className="monitor-stat-card">
                        <span className="monitor-stat-label">
                          RAM Usage
                        </span>
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
                        <strong>
                          {displayDeployment?.status || "offline"}
                        </strong>
                      </div>

                      <div className="runtime-item">
                        <span>Container</span>
                        <strong>
                          {displayDeployment?.container_id
                            ? "Attached"
                            : "Detached"}
                        </strong>
                      </div>
                    </div>

                    <div className="health-card">
                      <div className="health-pulse"></div>

                      <div>
                        <span className="health-label">
                          System Health
                        </span>
                        <h2>
                          {monitoringAvailable
                            ? metrics?.health || "healthy"
                            : "Waiting for Metrics"}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="section-block">
                    <p className="section-title">
                      Live Deployment Logs
                    </p>
                    <LogsViewer
                      deploymentId={effectiveDeploymentId}
                    />
                  </div>
                </div>
              </div>

              <div className="history-section">
                <div className="section-header">
                  <h1>Deployment History</h1>
                  <div className="count-badge">
                    {deployments?.length || 0} Deployments
                  </div>
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
            </section>
          </>
        );

      case "deployments":
        return (
          <section className="deployment-ui page-spacing">
            <div className="section-header">
              <h1>All Deployments</h1>
              <div className="count-badge">
                {deployments?.length || 0} Deployments
              </div>
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
          </section>
        );

      case "logs":
        return (
          <section className="deployment-ui page-spacing">
            <div className="section-header">
              <h1>Deployment Engine Logs</h1>
            </div>

            <LogsViewer
              deploymentId={effectiveDeploymentId}
            />
          </section>
        );

      case "monitoring":
        return (
          <section className="deployment-ui page-spacing">
            <MonitoringPanel
              metrics={metrics}
              cpuHistory={cpuHistory}
              ramHistory={ramHistory}
              networkHistory={networkHistory}
              deploymentStatus={displayDeployment?.status}
              deploymentId={effectiveDeploymentId}
            />
          </section>
        );

      case "analytics":
        return <ComingSoon title="Analytics Dashboard" />;

      case "settings":
        return <ComingSoon title="Project Settings" />;

      default:
        return null;
    }
  };

  return renderPage();
}


function Dashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [activeDeployment, setActiveDeployment] =
    useState(null);

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

  const effectiveDeploymentId =
    activeDeployment?.id ?? latestDeployment?.id;

  return (
    <div className="dashboard">
      <div className="bg-container">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-grid"></div>
      </div>

      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {initialLoading ? (
        <div className="loader-container">
          <div className="loader-ring">
            <div className="loader-ring-outer"></div>
            <div className="loader-ring-inner"></div>
          </div>
          <p className="loader-text">Loading Deployments...</p>
        </div>
      ) : (
        <DeploymentSocketProvider
          deploymentId={effectiveDeploymentId}
        >
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
    </div>
  );
}

export default Dashboard;
