import { useEffect, useState } from "react";

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

  const [activePage, setActivePage] = useState("dashboard");

  const [deployments, setDeployments] = useState([]);

  const [latestDeployment, setLatestDeployment] = useState(null);

  const fetchDeployments = async () => {

    try {

      const response = await API.get("/deployments");

      const deploymentData =
        response.data.deployments || [];

      setDeployments(deploymentData);

      if (deploymentData.length > 0) {

        const latest =
          deploymentData[deploymentData.length - 1];

        setLatestDeployment(latest);

        localStorage.setItem(
          "deployment_url",
          latest.url
        );
      }

    } catch (error) {

      console.error(
        "Failed to fetch deployments:",
        error
      );

    }
  };

  useEffect(() => {

    fetchDeployments();

    const interval = setInterval(() => {

      fetchDeployments();

    }, 5000);

    return () => clearInterval(interval);

  }, []);

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
                Smart DevOps Deployment Platform
              </p>

              <RepoForm
                refreshDeployments={fetchDeployments}
              />

            </section>

            <section className="deployment-ui">

              <div className="dashboard-grid">

                <div className="grid-left">

                  <div className="section-block">

                    <p className="section-title">
                      Production Deployment
                    </p>

                    <ProductionLink
                      deployment={latestDeployment}
                    />

                  </div>

                  <div className="section-block">

                    <p className="section-title">
                      Deployment Pipeline
                    </p>

                    <DeploymentPipeline
                      status={latestDeployment?.status}
                    />

                  </div>

                </div>

                <div className="grid-right">

                  <div className="section-block">

                    <p className="section-title">
                      Deployment Logs
                    </p>

                    <LogsViewer />

                  </div>

                </div>

              </div>

              <div className="history-section">

                <p className="section-title">
                  Deployment History
                </p>

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

            <p className="section-title">
              All Deployments
            </p>

            <DeploymentHistory
              deployments={deployments}
            />

          </section>

        );

      case "logs":

        return (

          <section className="deployment-ui page-spacing">

            <p className="section-title">
              Deployment Engine Logs
            </p>

            <LogsViewer />

          </section>

        );

      case "monitoring":

        return (
          <ComingSoon title="Monitoring" />
        );

      default:
        return null;
    }
  };

  return (

    <div className="dashboard">

      {/* Animated Background */}

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

      {renderPage()}

    </div>

  );
}

export default Dashboard;