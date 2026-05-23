import { useEffect, useState, useRef } from "react";

import useDeploymentSocket from "../hooks/useDeploymentSocket";

import Navbar from "../components/Navbar";
import RepoForm from "../components/RepoForm";
import DeploymentHistory from "../components/DeploymentHistory";
import ProductionLink from "../components/ProductionLink";
import LogsViewer from "../components/LogsViewer";
import DeploymentPipeline from "../components/DeploymentPipeline";

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

                <div className="grid-left">

                  <div className="section-block">

                    <p className="section-title">
                      Production Deployment
                    </p>

                    <ProductionLink
                      deployment={
                        latestDeployment
                      }
                    />

                  </div>

                  <div className="section-block">

                    <p className="section-title">
                      Deployment Pipeline
                    </p>

                    <DeploymentPipeline
                      status={
                        latestDeployment?.status
                      }
                    />

                  </div>

                </div>

                <div className="grid-right">

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

                    {deployments.length}
                    {" "}
                    Deployments

                  </div>

                </div>

                <DeploymentHistory
                  deployments={deployments}
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
          <ComingSoon
            title="Monitoring"
          />
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