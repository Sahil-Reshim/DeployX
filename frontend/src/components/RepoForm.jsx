import { useState } from "react";
import API from "../services/api";
import Loader from "./Loader";

function RepoForm() {

  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleDeploy = async () => {

    if (!repoUrl) {
      setMessage("Enter GitHub Repository URL");
      return;
    }

    try {

      setLoading(true);
      setMessage("");

      const response = await API.post("/deploy", {
        repo_url: repoUrl,
      });

      setMessage(
        response.data.message ||
        "Deployment Started Successfully 🚀"
      );

    } catch (error) {

      setMessage(
        error.response?.data?.error ||
        "Deployment Failed"
      );

    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="repo-form">

      <div className="input-container">

        <input
          type="text"
          placeholder="Paste GitHub Repository URL..."
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />

        <button
          onClick={handleDeploy}
          disabled={loading}
        >
          {loading ? "Deploying..." : "Deploy Now"}
        </button>

      </div>

      {loading && <Loader />}

      {message && (
        <p className="deploy-message">
          {message}
        </p>
      )}

    </div>
  );
}

export default RepoForm;