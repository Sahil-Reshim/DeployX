import { useEffect, useRef, useState } from "react";
import API from "../services/api";
import Loader from "./Loader";

function RepoForm({
  refreshDeployments,
  setActiveDeployment,
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

  const pollingRef = useRef(null);

  useEffect(() => {

    return () => {

      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

    };

  }, []);

  const stopPolling = () => {

    if (pollingRef.current) {

      clearInterval(
        pollingRef.current
      );

      pollingRef.current = null;

    }
  };

  const pollDeploymentStatus =
    (deploymentId) => {

      stopPolling();

      pollingRef.current =
        setInterval(async () => {

          try {

            const response =
              await API.get(
                `/deployments/${deploymentId}/status`
              );

            const deployment =
              response.data;

            const status =
              (
                deployment.status ||
                ""
              ).toLowerCase();

            setActiveDeployment(
              deployment
            );

            await refreshDeployments();

            if (
              status === "running" ||
              status === "live"
            ) {

              setMessage({
                text:
                  `Deployment Live 🚀 ${deployment.url}`,
                type: "success"
              });

              stopPolling();

              setLoading(false);

            }

            if (
              status === "failed"
            ) {

              setMessage({
                text:
                  deployment.error ||
                  "Deployment failed",
                type: "error"
              });

              stopPolling();

              setLoading(false);

            }

          } catch (error) {

            console.error(
              "Polling error:",
              error
            );

            stopPolling();

            setLoading(false);

            setMessage({
              text:
                "Failed to fetch deployment status",
              type: "error"
            });

          }

        }, 2000);
    };

  const handleDeploy =
    async (e) => {

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
            "Initializing deployment pipeline...",
          type: "info"
        });

        const response =
          await API.post(
            "/deploy",
            {
              repo_url:
                repoUrl.trim()
            }
          );

        if (!response.data?.success) {

          throw new Error(
            response.data?.error ||
            response.data?.message ||
            "Deployment request failed"
          );

        }

        const deploymentId =
          response.data
            ?.deployment_id;

        if (!deploymentId) {

          throw new Error(
            "Deployment ID missing"
          );

        }

        setActiveDeployment({
          deployment_id:
            deploymentId,
          repo_url:
            repoUrl.trim(),
          status: "queued",
          logs: [],
          steps: []
        });

        pollDeploymentStatus(
          deploymentId
        );

        setRepoUrl("");

        setLoading(false);

        setMessage({
          text: "Deployment started successfully. Tracking live status...",
          type: "success"
        });

      } catch (error) {

        setLoading(false);

        if (error.response) {

          setMessage({
            text:
              error.response.data
                .error ||
              error.response.data
                .message ||
              "Deployment failed",
            type: "error"
          });

        } else {

          setMessage({
            text:
              error.message ||
              "Cannot connect to backend server",
            type: "error"
          });

        }

      }
    };

  return (

    <div className="repo-form-container">

      <div className="repo-form-glow"></div>

      <div className="repo-form-header">

        <div className="repo-mini-badge">
          DEPLOYX CLOUD
        </div>

        <h2>
          Deploy GitHub Repository
        </h2>

        <p>
          Build, containerize and deploy
          applications instantly with
          real-time monitoring.
        </p>

      </div>

      <form
        className="repo-form"
        onSubmit={handleDeploy}
      >

        <div className="repo-input-group">

          <label className="repo-input-label">
            Repository URL
          </label>

          <div className="repo-input-wrapper">

              <span className="repo-prefix">
                  GitHub
              </span>

              <input
                type="text"
                placeholder="https://github.com/user/project"
                className="repo-input"
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
            loading
              ? "loading"
              : ""
          }`}
          disabled={loading}
        >

          {loading ? (
            <>
              <span className="deploy-spinner"></span>
              Deploying...
            </>
          ) : (
            <>
              Launch Deployment
            </>
          )}

        </button>

      </form>

      {loading && <Loader />}

      {message.text && (

        <div
          className={`deploy-message ${message.type}`}
        >

          {message.text}

        </div>

      )}

    </div>
  );
}

export default RepoForm;