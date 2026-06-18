import { useEffect, useRef, useState } from "react";
import API from "../services/api";
import Loader from "./Loader";

function RepoForm({
  refreshDeployments,
  setActiveDeployment,
  upsertLatestDeployment,
}) {

  const [repoUrl, setRepoUrl] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState({
    text: "",
    type: ""
  });

  const pollingRef = useRef(null);

  /* ─────────────────────────────────────────────
     CLEANUP
  ───────────────────────────────────────────── */

  useEffect(() => {

    return () => {

      if (pollingRef.current) {

        clearInterval(pollingRef.current);

      }

    };

  }, []);

  /* ─────────────────────────────────────────────
     STOP POLLING
  ───────────────────────────────────────────── */

  const stopPolling = () => {

    if (pollingRef.current) {

      clearInterval(pollingRef.current);

      pollingRef.current = null;

    }

  };

  /* ─────────────────────────────────────────────
     POLL DEPLOYMENT STATUS
  ───────────────────────────────────────────── */

  const pollDeploymentStatus = (deploymentId) => {

    stopPolling();

    pollingRef.current = setInterval(async () => {

      try {

        const response = await API.get(
          `/deployments/${deploymentId}/status`
        );

        const deployment =
          response.data?.deployment ||
          response.data;

        if (!deployment) return;

        const normalizedDeployment = {
          ...deployment,
          id:
            deployment.id ||
            deployment.deployment_id,
          jenkins_stages:
            deployment.jenkins_stages || [],
        };

        const status = (
          normalizedDeployment.status || ""
        ).toLowerCase();

        setActiveDeployment(
          normalizedDeployment
        );

        upsertLatestDeployment?.(
          normalizedDeployment
        );

        await refreshDeployments();

        /* SUCCESS */

        if (
          status === "running" ||
          status === "live"
        ) {

          setMessage({
            text:
              `Deployment Live 🚀 ${normalizedDeployment.url || ""}`,
            type: "success"
          });

          stopPolling();

          setLoading(false);

        }

        /* FAILED */

        if (status === "failed") {

          setMessage({
            text:
              normalizedDeployment.error ||
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

  /* ─────────────────────────────────────────────
     DEPLOY
  ───────────────────────────────────────────── */

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
          "Initializing deployment pipeline...",
        type: "info"
      });

      const response = await API.post(
        "/deploy",
        {
          repo_url: repoUrl.trim()
        }
      );

      const data = response.data;

      if (!data?.success) {

        throw new Error(
          data?.error ||
          data?.message ||
          "Deployment request failed"
        );

      }

      const deploymentId =
        data?.deployment_id;

      if (!deploymentId) {

        throw new Error(
          "Deployment ID missing"
        );

      }

      /* ACTIVE DEPLOYMENT */

      const newDeployment = {
        id: deploymentId,
        deployment_id: deploymentId,
        repo_url: repoUrl.trim(),
        status: "queued",
        logs: [],
        jenkins_stages: [],
      };

      setActiveDeployment(newDeployment);

      upsertLatestDeployment?.(newDeployment);

      /* START POLLING */

      pollDeploymentStatus(
        deploymentId
      );

      /* RESET */

      setRepoUrl("");

      setMessage({
        text:
          "Deployment started successfully 🚀",
        type: "success"
      });

    } catch (error) {

      console.error(error);

      setLoading(false);

      if (error.response) {

        setMessage({
          text:
            error.response.data?.error ||
            error.response.data?.message ||
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

  /* ─────────────────────────────────────────────
     UI
  ───────────────────────────────────────────── */

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

          <div className="repo-url-wrapper">

            <span className="repo-url-icon">
              GitHub
            </span>

            <input
              type="text"
              placeholder="https://github.com/user/project"
              className="repo-url-input"
              value={repoUrl}
              onChange={(e) =>
                setRepoUrl(e.target.value)
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