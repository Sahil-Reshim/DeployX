import { useEffect, useRef, useState } from "react";
import API from "../services/api";

function RepoForm({ refreshDeployments, setActiveDeployment, upsertLatestDeployment }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const pollingRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const pollDeploymentStatus = (deploymentId) => {
    stopPolling();
    let attempts = 0;
    // Rely on Socket.IO for live updates; this poll is only a fallback.
    // Slower cadence (5s) + attempt cap avoids hammering /status +
    // /deployments on every deploy.
    pollingRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const response = await API.get(`/deployments/${deploymentId}/status`);
        const deployment = response.data?.deployment || response.data;
        if (!deployment) return;

        const normalizedDeployment = {
          ...deployment,
          id: deployment.id || deployment.deployment_id,
          jenkins_stages: deployment.jenkins_stages || [],
        };

        const status = (normalizedDeployment.status || "").toLowerCase();
        setActiveDeployment(normalizedDeployment);
        upsertLatestDeployment?.(normalizedDeployment);

        if (status === "running" || status === "live") {
          setMessage({ text: "Deployment is Live — opening the production URL is enabled.", type: "success" });
          stopPolling();
          setLoading(false);
        }
        if (status === "failed" || status === "stopped") {
          const msg = status === "failed"
            ? (normalizedDeployment.error || normalizedDeployment.jenkins_status
              ? `Deployment failed${normalizedDeployment.jenkins_status ? ` (Jenkins: ${normalizedDeployment.jenkins_status})` : ""}. Check Live Deployment Logs.`
              : "Deployment failed. Check Live Deployment Logs for details.")
            : "Deployment stopped. Start it again from Deployment History.";
          setMessage({ text: msg, type: status === "failed" ? "error" : "info" });
          stopPolling();
          setLoading(false);
        }
        // Safety stop: don't poll forever if the socket dies.
        if (attempts >= 60) {
          stopPolling();
          setLoading(false);
        }
      } catch (error) {
        console.error("Polling error:", error);
        stopPolling();
        setLoading(false);
        setMessage({ text: "Lost connection to the backend. Check the backend is running on :5000, then refresh.", type: "error" });
      }
    }, 5000);
  };

  const handleDeploy = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setMessage({ text: "Please enter a valid GitHub repository URL", type: "error" });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: "Initializing deployment pipeline...", type: "info" });
      const response = await API.post("/deploy", { repo_url: repoUrl.trim() });
      const data = response.data;

      if (!data?.success) {
        throw new Error(data?.error || data?.message || "Deployment request failed");
      }

      const deploymentId = data?.deployment_id;
      if (!deploymentId) throw new Error("Deployment ID missing");

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
      pollDeploymentStatus(deploymentId);
      setRepoUrl("");
      setMessage({ text: "Deployment started successfully 🚀", type: "success" });
    } catch (error) {
      console.error(error);
      setLoading(false);
      if (error.response) {
        setMessage({ text: error.response.data?.error || error.response.data?.message || "Deployment failed", type: "error" });
      } else {
        setMessage({ text: error.message || "Cannot connect to backend server", type: "error" });
      }
    }
  };

  return (
    <div className="repo-form-container">
      <form className="repo-form" onSubmit={handleDeploy}>
        <div className="repo-url-wrapper">
          <span className="repo-url-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            GitHub
          </span>
          <input
            type="text"
            placeholder="https://github.com/user/project"
            className="repo-url-input"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" className={`deploy-btn ${loading ? "loading" : ""}`} disabled={loading}>
          {loading ? (
            <>
              <span className="deploy-spinner"></span>
              Deploying...
            </>
          ) : (
            "Launch Deployment"
          )}
        </button>
      </form>
      {message.text && <div className={`deploy-message ${message.type}`}>{message.text}</div>}
    </div>
  );
}

export default RepoForm;