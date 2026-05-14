import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import RepoForm from "../components/RepoForm";
import DeploymentHistory from "../components/DeploymentHistory";
import LogsViewer from "../components/LogsViewer";

import API from "../services/api";

import "../styles/dashboard.css";

function Dashboard() {

  const [deployments, setDeployments] = useState([]);

  const fetchDeployments = async () => {

    try {

      const response = await API.get("/deployments");

      setDeployments(
        response.data.deployments || []
      );

    } catch (error) {

      console.log(error);

    }
  };

  useEffect(() => {

    fetchDeployments();

    const interval = setInterval(() => {

      fetchDeployments();

    }, 5000);

    return () => clearInterval(interval);

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
          refreshDeployments={fetchDeployments}
        />

      </section>

      <section className="deployment-ui">

        <DeploymentHistory
          deployments={deployments}
        />

        <LogsViewer />

      </section>

    </div>
  );
}

export default Dashboard;