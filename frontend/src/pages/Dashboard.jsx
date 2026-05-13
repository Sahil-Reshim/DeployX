import Navbar from "../components/Navbar";
import RepoForm from "../components/RepoForm";
import "../styles/dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard">

      <Navbar />

      <div className="dashboard-content">

        <h1>DeployX</h1>

        <p>
          Deploy your GitHub repositories instantly
        </p>

        <RepoForm />

      </div>

    </div>
  );
}

export default Dashboard;