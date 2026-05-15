import { useEffect, useState } from "react";
import API from "../services/api";

function LogsViewer({ deploymentId }) {
  const [buildLogs, setBuildLogs] = useState([]);
  const [runtimeLogs, setRuntimeLogs] = useState([]);

  const fetchLogs = async () => {
    if (!deploymentId) return;

    try {
      const buildRes = await API.get(
        `/deployments/${deploymentId}/logs`
      );

      const runtimeRes = await API.get(
        `/deployments/${deploymentId}/container-logs`
      );

      setBuildLogs(buildRes.data.logs || []);
      setRuntimeLogs(runtimeRes.data.logs || []);

    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  };

  useEffect(() => {
    fetchLogs();

    const interval = setInterval(fetchLogs, 3000);

    return () => clearInterval(interval);

  }, [deploymentId]);

  return (
    <div className="logs-container">

      <div className="logs-header">

        <div className="logs-header-left">

          <div className="logs-dots">
            <span className="logs-dot red"></span>
            <span className="logs-dot yellow"></span>
            <span className="logs-dot green"></span>
          </div>

          <p className="logs-title">
            deployment-engine.logs
          </p>

        </div>

        <div className="logs-status">
          <span className="logs-status-dot"></span>
          LIVE
        </div>

      </div>

      <div className="logs-box">

        {buildLogs.length === 0 &&
        runtimeLogs.length === 0 ? (
          <div className="log-line">
            <span className="log-message">
              Waiting for deployment logs...
            </span>
          </div>
        ) : (
          <>
            <div className="logs-section-title">
              BUILD LOGS
            </div>

            {buildLogs.map((log, index) => (
              <div className="log-line" key={index}>
                <span className="log-tag info">
                  BUILD
                </span>

                <span className="log-message">
                  {log}
                </span>
              </div>
            ))}

            <div className="logs-section-title runtime">
              CONTAINER LOGS
            </div>

            {runtimeLogs.map((log, index) => (
              <div className="log-line" key={index}>
                <span className="log-tag success">
                  RUNTIME
                </span>

                <span className="log-message">
                  {log}
                </span>
              </div>
            ))}
          </>
        )}

      </div>

    </div>
  );
}

export default LogsViewer;