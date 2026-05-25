import { useEffect, useState, useRef } from "react";

import useDeploymentSocket from "../hooks/useDeploymentSocket";

import Navbar from "../components/Navbar";
import RepoForm from "../components/RepoForm";
import DeploymentHistory from "../components/DeploymentHistory";
import ProductionLink from "../components/ProductionLink";
import LogsViewer from "../components/LogsViewer";
import DeploymentPipeline from "../components/DeploymentPipeline";
import MonitoringPanel from "../components/monitoring/MonitoringPanel";

import API from "../services/api";

import "../styles/dashboard.css";
import "../styles/navbar.css";
import "../styles/deployment.css";
import "../styles/logs.css";
import "../styles/animations.css";

function ComingSoon({ title }) {

  return (

    <div className="coming-soon-page">

      <div className="coming-soon-card">

        <span className="coming-soon-badge-large">
          Coming Soon
        </span>

        <h1>{title}</h1>

        <p>
          This feature is under active development.
        </p>

      </div>

    </div>

  );

}

function Dashboard() {

  const [activePage, setActivePage] =
    useState("dashboard");

  const [deployments, setDeployments] =
    useState([]);

  const [latestDeployment, setLatestDeployment] =
    useState(null);

  const [activeDeployment, setActiveDeployment] =
    useState(null);

    const [metrics, setMetrics] =
  useState({
    cpu: 0,
    ram: 0,
    network_rx: 0,
    network_tx: 0,
    health: "healthy"
  });

const [cpuHistory, setCpuHistory] =
  useState([]);

const [ramHistory, setRamHistory] =
  useState([]);

const [networkHistory, setNetworkHistory] =
  useState([]);

  const [initialLoading, setInitialLoading] =
    useState(true);

  const hasFetched = useRef(false);

  const {
    statusData
  } = useDeploymentSocket(
    latestDeployment?.id
  );

  /* ─────────────────────────────────────────────
     FETCH DEPLOYMENTS
  ───────────────────────────────────────────── */

  const fetchDeployments = async () => {

    try {

      const response = await API.get(
        "/deployments"
      );

      const deploymentData =
        Array.isArray(response.data)
          ? response.data
          : response.data.deployments || [];

      const sortedDeployments =
        deploymentData.sort(
          (a, b) =>
            new Date(
              b.created_at || 0
            ) -
            new Date(
              a.created_at || 0
            )
        );

      setDeployments(
        sortedDeployments
      );

      if (
        sortedDeployments.length > 0
      ) {

        setLatestDeployment(
          sortedDeployments[0]
        );

      } else {

        setLatestDeployment(null);

      }

    } catch (error) {

      console.error(
        "Failed to fetch deployments:",
        error
      );

    } finally {

      setInitialLoading(false);

    }

  };

  /* ─────────────────────────────────────────────
   DELETE DEPLOYMENT
───────────────────────────────────────────── */

const handleDeleteDeployment = async (
  deploymentId
) => {

  try {

    await API.delete(
      `/deployments/${deploymentId}`
    );

    /*
      REMOVE FROM UI
    */

    setDeployments((prev) =>

      prev.filter(

        (deployment) =>

          deployment.id !==
          deploymentId

      )

    );

    /*
      RESET ACTIVE
    */

    if (
      latestDeployment?.id ===
      deploymentId
    ) {

      setLatestDeployment(null);

    }

    /*
      REFRESH
    */

    fetchDeployments();

  } catch (error) {

    console.error(
      "Delete Error:",
      error
    );

    alert(

      error?.response?.data?.message ||

      "Failed to delete deployment"

    );

  }

};

  /* ─────────────────────────────────────────────
     SOCKET LIVE UPDATES
  ───────────────────────────────────────────── */

  useEffect(() => {

  if (!statusData)
    return;

  setLatestDeployment((prev) => ({
    ...(prev || {}),
    status: statusData.status
  }));

  setActiveDeployment((prev) => ({
    ...(prev || {}),
    status: statusData.status
  }));

  /*
    MONITORING METRICS
  */

  if (statusData.metrics) {

    setMetrics({
      cpu:
        statusData.metrics.cpu || 0,

      ram:
        statusData.metrics.ram || 0,

      network_rx:
        statusData.metrics.network_rx || 0,

      network_tx:
        statusData.metrics.network_tx || 0,

      health:
        statusData.metrics.health ||
        "healthy"
    });

    /*
      CPU HISTORY
    */

    setCpuHistory((prev) => [

      ...prev.slice(-20),

      {
        time:
          new Date()
            .toLocaleTimeString(),

        value:
          statusData.metrics.cpu || 0
      }

    ]);

    /*
      RAM HISTORY
    */

    setRamHistory((prev) => [

      ...prev.slice(-20),

      {
        time:
          new Date()
            .toLocaleTimeString(),

        value:
          statusData.metrics.ram || 0
      }

    ]);

    /*
      NETWORK HISTORY
    */

    setNetworkHistory((prev) => [

      ...prev.slice(-20),

      {
        time:
          new Date()
            .toLocaleTimeString(),

        rx:
          statusData.metrics.network_rx || 0,

        tx:
          statusData.metrics.network_tx || 0
      }

    ]);

  }

}, [statusData]);

/* ─────────────────────────────────────────────
   INITIAL LOAD
───────────────────────────────────────────── */

useEffect(() => {

  if (!hasFetched.current) {

    hasFetched.current = true;

    fetchDeployments();

  }

}, []);

  /* ─────────────────────────────────────────────
     PROGRESS
  ───────────────────────────────────────────── */

  const getProgress = () => {

    if (!latestDeployment)
      return 0;

    const status =
      latestDeployment?.status?.toLowerCase();

    switch (status) {

      case "queued":
        return 10;

      case "cloning":
        return 25;

      case "detecting":
        return 40;

      case "dockerfile_generating":
        return 55;

      case "building":
        return 72;

      case "deploying":
        return 90;

      case "running":
        return 100;

      case "live":
        return 100;

      case "failed":
        return 100;

      default:
        return 10;

    }

  };

  const isStepActive =
    (requiredProgress) => {

      return (
        getProgress() >=
        requiredProgress
      );

    };

  /* ─────────────────────────────────────────────
     PAGE RENDER
  ───────────────────────────────────────────── */

  const renderPage = () => {

    switch (activePage) {

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

                        {latestDeployment.repo_url
                          ? latestDeployment.repo_url
                              .replace(".git", "")
                              .split("/")
                              .slice(-2)
                              .join("/")
                          : "GitHub Repository"}

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
                        {getProgress()}%
                      </span>

                    </div>

                    <div className="progress-bar">

                      <div
                        className={`progress-fill ${
                          latestDeployment?.status?.toLowerCase()
                        }`}
                        style={{
                          width: `${getProgress()}%`
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

  {/* LEFT */}

  <div className="grid-left">

    {/* PRODUCTION */}

    <div className="section-block">

      <p className="section-title">
        Production Deployment
      </p>

      <ProductionLink
        deployment={latestDeployment}
      />

    </div>

    {/* PIPELINE */}

    <div className="section-block">

      <p className="section-title">
        Deployment Pipeline
      </p>

      <DeploymentPipeline
        status={latestDeployment?.status}
      />

    </div>

  </div>

  {/* RIGHT */}

  <div className="grid-right">

    {/* LIVE MONITORING */}

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

        <div className="monitoring-live">

          <span className="live-dot"></span>

          LIVE

        </div>

      </div>

      {/* STATS */}

      <div className="monitoring-stats-grid">

        <div className="monitor-stat-card">

          <span className="monitor-stat-label">
            CPU Usage
          </span>

          <h1>
            {metrics.cpu}%
          </h1>

          <div className="monitor-bar">

            <div
              className="monitor-bar-fill cpu"
              style={{
                width: `${metrics.cpu}%`
              }}
            />

          </div>

        </div>

        <div className="monitor-stat-card">

          <span className="monitor-stat-label">
            RAM Usage
          </span>

          <h1>
            {metrics.ram}%
          </h1>

          <div className="monitor-bar">

            <div
              className="monitor-bar-fill ram"
              style={{
                width: `${metrics.ram}%`
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
            {metrics.network_rx}
            {" "}
            KB/s
          </h3>

        </div>

        <div className="network-box">

          <span>
            Network TX
          </span>

          <h3>
            {metrics.network_tx}
            {" "}
            KB/s
          </h3>

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
            {metrics.health}
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

    {/* EXTRA MONITORING */}

    <div className="section-block infra-card">

      <div className="infra-top">

        <div>

          <span className="infra-mini">
            DEPLOYX EDGE NETWORK
          </span>

          <h2>
            Global Runtime Infrastructure
          </h2>

        </div>

        <div className="infra-status">

          OPERATIONAL

        </div>

      </div>

      <div className="infra-grid">

        <div className="infra-node">

          <span>Containers</span>

          <h1>12</h1>

        </div>

        <div className="infra-node">

          <span>Requests</span>

          <h1>24K</h1>

        </div>

        <div className="infra-node">

          <span>Latency</span>

          <h1>43ms</h1>

        </div>

        <div className="infra-node">

          <span>Regions</span>

          <h1>8</h1>

        </div>

      </div>

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

                    {deployments.length}
                    {" "}
                    Deployments

                  </div>

                </div>

                <DeploymentHistory
                  deployments={deployments}
                  onDeleteDeployment={handleDeleteDeployment}
                  onRefresh={fetchDeployments}
                />

              </div>

            </section>

          </>

        );

      case "deployments":

        return (

          <section className="deployment-ui page-spacing">

            <div className="section-header">

              <h1>
                All Deployments
              </h1>

              <div className="count-badge">

                {deployments.length}
                {" "}
                Deployments

              </div>

            </div>

            <DeploymentHistory
              deployments={deployments}
              onDeleteDeployment={handleDeleteDeployment}
              onRefresh={fetchDeployments}
            />

          </section>

        );

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
      />

    </section>

  );

      default:
        return null;

    }

  };

  /* ─────────────────────────────────────────────
     MAIN RETURN
  ───────────────────────────────────────────── */

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