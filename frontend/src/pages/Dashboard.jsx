import { useEffect, useState, useRef } from "react";

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
        <span className="coming-soon-badge-large">Coming Soon</span>
        <h1>{title}</h1>
        <p>This feature is under active development.</p>
      </div>
    </div>
  );
}

function Dashboard() {

  const [activePage, setActivePage] = useState("dashboard");
  const [deployments, setDeployments] = useState([]);
  const [latestDeployment, setLatestDeployment] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchDeployments = async (showLoader = false) => {
    try {
      const response = await API.get("/deployments");
      const deploymentData = response.data.deployments || [];

      setDeployments(deploymentData);

      if (deploymentData.length > 0) {
        const latest = deploymentData[deploymentData.length - 1];
        setLatestDeployment(latest);
        localStorage.setItem("deployment_url", latest.url || "");
      }
    } catch (error) {
      console.error("Failed to fetch deployments:", error);
    } finally {
      if (showLoader) setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchDeployments(true); // show loader only once on mount
    }

    const interval = setInterval(() => {
      fetchDeployments(false); // silent background refresh every 5s
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
              <h1>Deploy<span>X</span></h1>
              <p className="hero-subtitle">
                Automated GitHub Deployments,
                Docker Runtime,
                Real-Time Logs &amp;
                Smart DevOps Monitoring
              </p>
              <RepoForm refreshDeployments={() => fetchDeployments(false)} />
            </section>

            <section className="deployment-ui">
              <div className="dashboard-grid">
                <div className="grid-left">
                  <div className="section-block">
                    <p className="section-title">Production Deployment</p>
                    <ProductionLink deployment={latestDeployment} />
                  </div>
                  <div className="section-block">
                    <p className="section-title">Deployment Pipeline</p>
                    <DeploymentPipeline status={latestDeployment?.status} />
                  </div>
                </div>
                <div className="grid-right">
                  <div className="section-block">
                    <p className="section-title">Live Deployment Logs</p>
                    <LogsViewer deploymentId={latestDeployment?.id} />
                  </div>
                </div>
              </div>

              <div className="history-section">
                <div className="section-header">
                  <h1>Deployment History</h1>
                  <div className="count-badge">{deployments.length} Deployments</div>
                </div>
                <DeploymentHistory deployments={deployments} />
              </div>
            </section>
          </>
        );

      case "deployments":
        return (
          <section className="deployment-ui page-spacing">
            <div className="section-header">
              <h1>All Deployments</h1>
              <div className="count-badge">{deployments.length} Deployments</div>
            </div>
            <DeploymentHistory deployments={deployments} />
          </section>
        );

      case "logs":
        return (
          <section className="deployment-ui page-spacing">
            <div className="section-header">
              <h1>Deployment Engine Logs</h1>
            </div>
            <LogsViewer deploymentId={latestDeployment?.id} />
          </section>
        );

      case "monitoring":
        return <ComingSoon title="Monitoring" />;

      default:
        return null;
    }
  };

  return (
    <div className="dashboard">

      <div className="bg-container">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-grid"></div>
      </div>

      <Navbar activePage={activePage} setActivePage={setActivePage} />

      {initialLoading ? (
        <div className="loader-container">
          <div className="loader-ring">
            <div className="loader-ring-outer"></div>
            <div className="loader-ring-inner"></div>
          </div>
          <p className="loader-text">Loading Deployments...</p>
        </div>
      ) : (
        renderPage()
      )}

    </div>
  );
}

export default Dashboard;