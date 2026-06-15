import { useEffect, useMemo, useState } from "react";

import useDeploymentSocket from "../hooks/useDeploymentSocket";
import useDeployments from "../hooks/useDeployments";
import useMonitoring from "../hooks/useMonitoring";

import Navbar from "../components/Navbar";
import RepoForm from "../components/RepoForm";
import DeploymentHistory from "../components/DeploymentHistory";
import ProductionLink from "../components/ProductionLink";
import LogsViewer from "../components/LogsViewer";
import DeploymentPipeline from "../components/DeploymentPipeline";
import MonitoringPanel from "../components/monitoring/MonitoringPanel";
import JenkinsPipeline from "../components/JenkinsPipeline";

import "../styles/dashboard.css";
import "../styles/navbar.css";
import "../styles/deployment.css";
import "../styles/logs.css";
import "../styles/animations.css";



function Dashboard() {

  /*
  ─────────────────────────────────────────────
  ACTIVE PAGE
  ─────────────────────────────────────────────
  */

  const [activePage, setActivePage] =
    useState("dashboard");


  const [jenkinsData, setJenkinsData] =
    useState(null);


  /*
  ─────────────────────────────────────────────
  ACTIVE DEPLOYMENT
  ─────────────────────────────────────────────
  */

  const [activeDeployment, setActiveDeployment] =
    useState(null);

  /*
  ─────────────────────────────────────────────
  DEPLOYMENTS HOOK
  ─────────────────────────────────────────────
  */

  const {

    deployments,

    latestDeployment,

    setLatestDeployment,

    loading: initialLoading,

    fetchDeployments,

    deleteDeployment,

    startDeployment,

    stopDeployment,

    restartDeployment,

    actionLoading

  } = useDeployments();

  /*
  ─────────────────────────────────────────────
  SOCKET
  ─────────────────────────────────────────────
  */

  const {
    statusData
  } = useDeploymentSocket(
    latestDeployment?.id
  );

  /*
  ─────────────────────────────────────────────
  MONITORING
  ─────────────────────────────────────────────
  */

  const {

    metrics,

    cpuHistory,

    ramHistory,

    networkHistory

  } = useMonitoring(statusData);

  const monitoringAvailable =
  (metrics?.cpu || 0) > 0 ||
  (metrics?.ram || 0) > 0 ||
  (metrics?.network_rx || 0) > 0 ||
  (metrics?.network_tx || 0) > 0;

  /*
  ─────────────────────────────────────────────
  LIVE STATUS UPDATE
  FIXED: useEffect instead of useState
  ─────────────────────────────────────────────
  */

  useEffect(() => {
  if (!statusData) return;

  console.log("SOCKET STATUS:", statusData);

  setLatestDeployment((prev) => {
    if (!prev) return prev;

    return {
      ...prev,
      status:
        statusData.status ??
        prev.status,

      url:
        statusData.url ??
        prev.url,

      logs:
        statusData.logs ??
        prev.logs,

      metrics:
        statusData.metrics ??
        prev.metrics,

      container_id:
        statusData.container_id ??
        prev.container_id,
    };
  });

  setActiveDeployment((prev) => {
    if (!prev) return prev;

    return {
      ...prev,
      status:
        statusData.status ??
        prev.status,

      url:
        statusData.url ??
        prev.url,

      metrics:
        statusData.metrics ??
        prev.metrics,

      container_id:
        statusData.container_id ??
        prev.container_id,
    };
  });

}, [
  statusData,
  setLatestDeployment
]);
  /*
  ─────────────────────────────────────────────
  DEPLOYMENT PROGRESS
  ─────────────────────────────────────────────
  */

  const deploymentProgress =
    useMemo(() => {


      if (!latestDeployment)
        return 0;

      const status =
        latestDeployment?.status
          ?.toLowerCase();

      switch (status) {
        case "queued":
          return 10;

        case "cloning":
          return 20;

        case "detecting":
          return 30;

        case "dockerfile_generating":
          return 40;

        case "ci_pipeline":
          return 50;

        // Jenkins stages
        case "clone_repository":
          return 55;

        case "verify_files":
          return 60;

        case "build_docker_image":
          return 70;

        case "verify_image":
          return 80;

        // backend docker build
        case "docker_build":
          return 85;

        case "deploying":
          return 95;

        case "running":
        case "completed":
        case "live":
          return 100;

        case "failed":
          return 100;

        default:
          return 0;
      }

    }, [latestDeployment]);

  /*
  ─────────────────────────────────────────────
  STEP ACTIVE
  ─────────────────────────────────────────────
  */

  const isStepActive =
    (requiredProgress) => {

      return (
        deploymentProgress >=
        requiredProgress
      );

    };

  /*
  ─────────────────────────────────────────────
  ACTIVE DEPLOYMENT NAME EXTRACTION
  ─────────────────────────────────────────────
  */
  const deploymentName =
    useMemo(() => {

      if (!latestDeployment?.repo_url) {

        return "GitHub Repository";

      }

      return latestDeployment.repo_url
        .replace(".git", "")
        .split("/")
        .slice(-2)
        .join("/");

    }, [latestDeployment]);

  /*
  ─────────────────────────────────────────────
  PAGE RENDER
  ─────────────────────────────────────────────
  */

  const renderPage = () => {

    switch (activePage) {

      /*
      ─────────────────────────────────────────
      DASHBOARD
      ─────────────────────────────────────────
      */

      case "dashboard":

        return (

          <>

            {/* HERO */}

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
              />

            </section>

            {/* MAIN */}

            <section className="deployment-ui">

              {latestDeployment && (

                <div className="active-deployment-card">

                  <div className="active-top">

                    <div>

                      <p className="active-label">
                        Active Deployment
                      </p>

                      <h2>
                        {deploymentName}
                      </h2>

                    </div>

                    <div
                      className={`status-pill ${
                        latestDeployment?.status?.toLowerCase() ||
                        "offline"
                      }`}
                    >

                      {latestDeployment?.status ||
                        "offline"}

                    </div>

                  </div>

                  {/* PROGRESS */}

                  <div className="progress-wrapper">

                    <div className="progress-info">

                      <span>
                        Deployment Progress
                      </span>

                      <span>
                        {deploymentProgress}%
                      </span>

                    </div>

                    <div className="progress-bar">

                      <div
                        className={`progress-fill ${
                          latestDeployment?.status?.toLowerCase()
                        }`}
                        style={{
                          width: `${deploymentProgress}%`
                        }}
                      />

                    </div>

                  </div>

                  {/* MINI PIPELINE */}

                  <div className="pipeline-mini">

                    <div
                      className={`pipeline-step ${
                        isStepActive(10)
                          ? "active"
                          : ""
                      }`}
                    >
                      Queue
                    </div>

                    <div
                      className={`pipeline-step ${
                        isStepActive(25)
                          ? "active"
                          : ""
                      }`}
                    >
                      Clone
                    </div>

                    <div
                      className={`pipeline-step ${
                        isStepActive(40)
                          ? "active"
                          : ""
                      }`}
                    >
                      Detect
                    </div>

                    <div
                      className={`pipeline-step ${
                        isStepActive(55)
                          ? "active"
                          : ""
                      }`}
                    >
                      Dockerfile
                    </div>

                    <div
                      className={`pipeline-step ${
                        isStepActive(72)
                          ? "active"
                          : ""
                      }`}
                    >
                      Build
                    </div>

                    <div
                      className={`pipeline-step ${
                        isStepActive(90)
                          ? "active"
                          : ""
                      }`}
                    >
                      Deploy
                    </div>

                    <div
                      className={`pipeline-step ${
                        isStepActive(100)
                          ? "active"
                          : ""
                      }`}
                    >
                      Live
                    </div>

                  </div>

                </div>

              )}

              {/* GRID */}

              <div className="dashboard-grid">

 {/* LEFT COLUMN */}

<div className="grid-left">

  {/* Deployment Pipeline */}

  <div className="section-block">

    <p className="section-title">
      Deployment Pipeline
    </p>

    <DeploymentPipeline
      status={latestDeployment?.status}
    />

  </div>

  {/* Jenkins Pipeline */}

  <div className="section-block jenkins-card">

    <div className="jenkins-card-header">

      <div className="jenkins-header-left">

        <span className="jenkins-mini">
          Continuous Integration
        </span>

        <h2 className="jenkins-title">
          Build #{jenkinsData?.build_number || "--"}
        </h2>

        <p className="jenkins-subtitle">
          Automated Jenkins CI/CD Execution
        </p>

      </div>

      <div
        className={`jenkins-status ${
          jenkinsData?.status?.toLowerCase() || "pending"
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
                {/* RIGHT */}

                <div className="grid-right">

                  {/* MONITORING */}

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
                        monitoringAvailable
                          ? "live"
                          : "offline"
                      }`}
                    >
                      <span className="live-dot"></span>

                      {monitoringAvailable
                        ? "LIVE"
                        : "WAITING"}
                    </div>

                    </div>

                    {/* STATS */}

                    <div className="monitoring-stats-grid">

                      <div className="monitor-stat-card">

                        <span className="monitor-stat-label">
                          CPU Usage
                        </span>

                        <h1>
                          {metrics?.cpu || 0}%
                        </h1>

                        <div className="monitor-bar">

                          <div
                            className="monitor-bar-fill cpu"
                            style={{
                              width: `${metrics?.cpu || 0}%`
                            }}
                          />

                        </div>

                      </div>

                      <div className="monitor-stat-card">

                        <span className="monitor-stat-label">
                          RAM Usage
                        </span>

                        <h1>
                          {metrics?.ram || 0}%
                        </h1>

                        <div className="monitor-bar">

                          <div
                            className="monitor-bar-fill ram"
                            style={{
                              width: `${metrics?.ram || 0}%`
                            }}
                          />

                        </div>

                      </div>

                    </div>

                    {/* NETWORK */}

                    <div className="network-activity">

                      <div className="network-box">

                        <span>
                          Network RX
                        </span>

                        <h3>
                          {metrics?.network_rx || 0} KB/s
                        </h3>

                      </div>

                      <div className="network-box">

                        <span>
                          Network TX
                        </span>

                        <h3>
                          {metrics?.network_tx || 0} KB/s
                        </h3>

                      </div>

                    </div>
                    <div className="runtime-status-card">

                        <div className="runtime-item">

                          <span>
                            Deployment
                          </span>

                          <strong>
                            {latestDeployment?.status ||
                              "offline"}
                          </strong>

                        </div>

                        <div className="runtime-item">

                          <span>
                            Container
                          </span>

                          <strong>
                            {latestDeployment?.container_id
                              ? "Attached"
                              : "Detached"}
                          </strong>

                        </div>

                      </div>

                    {/* HEALTH */}

                    <div className="health-card">

                      <div className="health-pulse"></div>

                      <div>

                        <span className="health-label">
                          System Health
                        </span>

                        <h2>
                          {monitoringAvailable
                            ? metrics?.health
                            : "Waiting for Metrics"}
                        </h2>

                      </div>

                    </div>

                  </div>

                  {/* LOGS */}

                  <div className="section-block">

                    <p className="section-title">
                      Live Deployment Logs
                    </p>

                    <LogsViewer
                      deploymentId={
                        latestDeployment?.id
                      }
                    />

                  </div>

                </div>

              </div>

              {/* HISTORY */}

              <div className="history-section">

                <div className="section-header">

                  <h1>
                    Deployment History
                  </h1>

                  <div className="count-badge">

                    {deployments?.length || 0}
                    {" "}
                    Deployments

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

      /*
      ─────────────────────────────────────────
      DEPLOYMENTS PAGE
      ─────────────────────────────────────────
      */

      case "deployments":

        return (

          <section className="deployment-ui page-spacing">

            <div className="section-header">

              <h1>
                All Deployments
              </h1>

              <div className="count-badge">

                {deployments?.length || 0}
                {" "}
                Deployments

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

        
      /*
      ─────────────────────────────────────────
      LOGS PAGE
      ─────────────────────────────────────────
      */

      case "logs":

        return (

          <section className="deployment-ui page-spacing">

            <div className="section-header">

              <h1>
                Deployment Engine Logs
              </h1>

            </div>

            <LogsViewer
              deploymentId={
                latestDeployment?.id
              }
            />

          </section>

        );

      /*
      ─────────────────────────────────────────
      MONITORING PAGE
      ─────────────────────────────────────────
      */

      case "monitoring":

        return (

          <section className="deployment-ui page-spacing">

            <MonitoringPanel
              metrics={metrics}
              cpuHistory={cpuHistory}
              ramHistory={ramHistory}
              networkHistory={networkHistory}
              deploymentStatus={
                latestDeployment?.status
              }
              deploymentId={
                latestDeployment?.id
              }
            />
          </section>

        );

      /*
      ─────────────────────────────────────────
      ANALYTICS
      ─────────────────────────────────────────
      */

      case "analytics":

        return (
          <ComingSoon title="Analytics Dashboard" />
        );

      /*
      ─────────────────────────────────────────
      SETTINGS
      ─────────────────────────────────────────
      */

      case "settings":

        return (
          <ComingSoon title="Project Settings" />
        );

      default:

        return null;

    }

  };

  /*
  ─────────────────────────────────────────────
  MAIN RETURN
  ─────────────────────────────────────────────
  */

  return (

    <div className="dashboard">

      {/* BACKGROUND */}

      <div className="bg-container">

        <div className="bg-orb bg-orb-1"></div>

        <div className="bg-orb bg-orb-2"></div>

        <div className="bg-orb bg-orb-3"></div>

        <div className="bg-grid"></div>

      </div>

      {/* NAVBAR */}

      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* LOADER */}

      {initialLoading ? (

        <div className="loader-container">

          <div className="loader-ring">

            <div className="loader-ring-outer"></div>

            <div className="loader-ring-inner"></div>

          </div>

          <p className="loader-text">
            Loading Deployments...
          </p>

        </div>

      ) : (

        renderPage()

      )}

    </div>

  );

}

export default Dashboard;