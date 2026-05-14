import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import RepoForm from "../components/RepoForm";
import DeploymentHistory from "../components/DeploymentHistory";
import ProductionLink from "../components/ProductionLink";
import LogsViewer from "../components/LogsViewer";

import API from "../services/api";

import "../styles/dashboard.css";

function Dashboard() {

  const [deployments, setDeployments] =
    useState([]);

  const [latestDeployment, setLatestDeployment] =
    useState(null);

  const fetchDeployments = async () => {

    try {

      const response =
        await API.get("/deployments");

      const deploymentData =
        response.data.deployments || [];

      setDeployments(deploymentData);

      if (deploymentData.length > 0) {

        const latest =
          deploymentData[
            deploymentData.length - 1
          ];

        setLatestDeployment(latest);

        localStorage.setItem(
          "deployment_url",
          latest.url
        );
      }

    } catch (error) {

      console.log(error);
    }
  };

  useEffect(() => {

    fetchDeployments();

    const interval = setInterval(() => {

      fetchDeployments();

    }, 5000);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div className="dashboard">

      <div className="background-glow"></div>

      <Navbar />

      <section className="hero-section">

        <h1>
          Deploy<span>X</span>
        </h1>

        <p>
          Smart DevOps Deployment Platform
        </p>

        <RepoForm
          refreshDeployments={
            fetchDeployments
          }
        />

      </section>

      <section className="deployment-ui">

        <ProductionLink
          deployment={latestDeployment}
        />

        <DeploymentHistory
          deployments={deployments}
        />

        <LogsViewer />

      </section>

    </div>
  );
}

export default Dashboard;