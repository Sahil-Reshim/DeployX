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

      <div className="background-glow"></div>

      <Navbar />

      <section className="hero-section">

        <h1>
          Deploy<span>X</span>
        </h1>

        <p>
          Smart DevOps Deployment Platform
        </p>

        <RepoForm />

      </section>

      <section className="deployment-ui">

        <DeployCard
          project="React Frontend"
          status="Running"
        />

        <DeploymentSteps />

        <ProductionLink />

        <LogsViewer />

      </section>

    </div>
  );
}

export default Dashboard;