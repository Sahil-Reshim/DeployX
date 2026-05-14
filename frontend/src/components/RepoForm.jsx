import { useState } from "react";
import API from "../services/api";
import Loader from "./Loader";

function RepoForm({ refreshDeployments }) {

  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleDeploy = async () => {

    if (!repoUrl.trim()) {

      setMessage(
        "Please enter a valid GitHub repository URL"
      );

      return;
    }

    try {

      setLoading(true);

      setMessage(
        "Starting deployment..."
      );

      console.log(
        "Sending repo URL:",
        repoUrl
      );

      const response = await API.post(
        "/deploy",
        {
          repo_url: repoUrl.trim(),
        }
      );

      console.log(
        "Backend Response:",
        response.data
      );

      setMessage(
        response.data.message ||
        "Deployment Started Successfully 🚀"
      );

      refreshDeployments();

      setRepoUrl("");

    } catch (error) {

      console.error(
        "Deployment Error:",
        error
      );

      if (error.response) {

        console.log(
          "Backend Error Data:",
          error.response.data
        );

        setMessage(
          error.response.data.error ||
          error.response.data.message ||
          "Backend Deployment Failed"
        );

      } else {

        setMessage(
          "Cannot connect to backend server"
        );
      }

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
          onChange={(e) =>
            setRepoUrl(e.target.value)
          }
        />

        <button
          onClick={handleDeploy}
          disabled={loading}
        >

          {
            loading
            ?
            "Deploying..."
            :
            "Deploy Now"
          }

        </button>

      </div>

      {loading && <Loader />}

      {

        message && (

          <p className="deploy-message">
            {message}
          </p>

        )

      }

    </div>
  );
}

export default RepoForm;