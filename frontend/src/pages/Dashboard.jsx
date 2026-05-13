import Navbar from "../components/Navbar";
import RepoForm from "../components/RepoForm";
import DeployCard from "../components/DeployCard";
import DeploymentSteps from "../components/DeploymentSteps";
import ProductionLink from "../components/ProductionLink";
import LogsViewer from "../components/LogsViewer";

import "../styles/dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard">

      <Navbar />

      <div className="hero-section">

        <h1>DeployX</h1>

        <p>
          Smart DevOps Deployment Platform
        </p>

        <RepoForm />

      </div>

      <div className="deployment-ui">

        <DeployCard
          project="React App"
          status="Running"
        />

        <DeploymentSteps />

        <ProductionLink />

        <LogsViewer />

      </div>

    </div>
  );
}

export default Dashboard;