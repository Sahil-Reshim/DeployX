import { useState } from "react";
import API from "../services/api";

function RepoForm() {

  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleDeploy = async () => {

    if (!repoUrl) {
      setMessage("Please enter a GitHub repository URL");
      return;
    }

    try {

      setLoading(true);
      setMessage("Starting deployment...");

      const response = await API.post("/deploy", {
        repo_url: repoUrl,
      });

      console.log(response.data);

      setMessage(
        response.data.message || "Deployment started successfully"
      );

    } catch (error) {

      console.error(error);

      setMessage(
        error.response?.data?.error ||
        "Deployment failed"
      );

    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="repo-form">

      <input
        type="text"
        placeholder="Enter GitHub Repository URL"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
      />

      <button onClick={handleDeploy} disabled={loading}>

        {loading ? "Deploying..." : "Deploy"}

      </button>

      {message && (
        <p className="deploy-message">
          {message}
        </p>
      )}

    </div>
  );
}

export default RepoForm;