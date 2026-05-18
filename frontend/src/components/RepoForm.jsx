import { useState } from "react";

import API from "../services/api";
import Loader from "./Loader";

function RepoForm({
  refreshDeployments
}) {

  const [repoUrl, setRepoUrl] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState({
      text: "",
      type: ""
    });

  const handleDeploy = async (e) => {

    e.preventDefault();

    if (!repoUrl.trim()) {

      setMessage({
        text:
          "Please enter a valid GitHub repository URL",
        type: "error"
      });

      return;
    }

    try {

      setLoading(true);

      setMessage({
        text:
          "Starting deployment...",
        type: "info"
      });

      const response =
        await API.post("/deploy", {
          repo_url: repoUrl.trim()
        });

      const deploymentUrl =
        response.data?.container?.url ||
        response.data?.url;

      setMessage({
        text:
          `Deployment Live 🚀 ${deploymentUrl}`,
        type: "success"
      });

      await refreshDeployments();

      setRepoUrl("");

    } catch (error) {

      if (error.response) {

        setMessage({
          text:
            error.response.data.error ||
            error.response.data.message ||
            "Backend Deployment Failed",
          type: "error"
        });

      } else {

        setMessage({
          text:
            "Cannot connect to backend server",
          type: "error"
        });

      }

    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="repo-form-container">

      <div className="repo-form-header">

        <h2>
          Deploy GitHub Repository
        </h2>

        <p>
          Paste your GitHub repository URL
          and DeployX will automatically
          build, deploy and monitor it.
        </p>

      </div>

      <form
        className="repo-form"
        onSubmit={handleDeploy}
      >

        <div className="repo-input-group">

          <label className="repo-input-label">

            GitHub Repository URL

          </label>

          <div className="repo-url-wrapper">

            <span className="repo-url-icon">

              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>

            </span>

            <input
              type="text"
              placeholder="https://github.com/username/repository"
              className="repo-url-input"
              value={repoUrl}
              onChange={(e) =>
                setRepoUrl(
                  e.target.value
                )
              }
              disabled={loading}
            />

          </div>

        </div>

        <button
          type="submit"
          className={`deploy-btn ${
            loading ? "loading" : ""
          }`}
          disabled={loading}
        >

          {loading ? (

            <>

              <span className="deploy-btn-spinner"></span>

              Deploying...

            </>

          ) : (

            <>
              Deploy Repository
            </>

          )}

        </button>

      </form>

      <div className="repo-form-info">

        Supports React, Vite,
        Next.js, Node.js and
        Dockerized applications.

      </div>

      {loading && <Loader />}

      {message.text && (

        <p
          className={`deploy-message ${message.type}`}
        >

          {message.text}

        </p>

      )}

    </div>

  );
}

export default RepoForm;