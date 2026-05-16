import {
  useEffect,
  useState,
  useRef
} from "react";

import API from "../services/api";

function LogsViewer({ deploymentId }) {

  const [logs, setLogs] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [autoScroll, setAutoScroll] =
    useState(true);

  const logsEndRef = useRef(null);

  const fetchLogs = async () => {

    if (!deploymentId) return;

    try {

      const response = await API.get(
        `/deployments/${deploymentId}/logs`
      );

      setLogs(response.data.logs || []);

      setLoading(false);

    } catch (error) {

      console.error(error);

      setLoading(false);

    }
  };

  useEffect(() => {

    fetchLogs();

    const interval = setInterval(
      fetchLogs,
      3000
    );

    return () => clearInterval(interval);

  }, [deploymentId]);

  // Auto-scroll to bottom when logs update

  useEffect(() => {

    if (autoScroll) {

      const logsBox =
        logsEndRef.current?.parentElement;

      if (logsBox) {
        logsBox.scrollTop = logsBox.scrollHeight;
      }

    }

  }, [logs, autoScroll]);

  const getLogType = (log) => {

    const lower = log.toLowerCase();

    if (
      lower.includes("error") ||
      lower.includes("failed")
    ) {
      return "error";
    }

    if (
      lower.includes("success") ||
      lower.includes("running")
    ) {
      return "success";
    }

    if (
      lower.includes("warning")
    ) {
      return "warn";
    }

    return "info";
  };

  if (loading) {

    return (

      <div className="logs-container">

        <div className="logs-loading">

          <div className="terminal-loader"></div>

          <p>
            Connecting to deployment logs...
          </p>

        </div>

      </div>

    );
  }

  return (

    <div className="logs-container">

      <div className="logs-header">

        <div className="logs-header-left">

          <div className="logs-dots">

            <span className="logs-dot red"></span>

            <span className="logs-dot yellow"></span>

            <span className="logs-dot green"></span>

          </div>

          <span className="logs-title">
            deployx-runtime
          </span>

        </div>

        <div className="logs-status">

          <span className="logs-status-dot"></span>

          LIVE STREAM
        </div>

      </div>

      <div className="logs-toolbar">

        <button
          className="logs-tool-btn"
          onClick={() =>
            setAutoScroll(!autoScroll)
          }
        >
          {autoScroll
            ? "Auto Scroll ON"
            : "Auto Scroll OFF"}
        </button>

        <div className="logs-count">
          {logs.length} logs
        </div>

      </div>

      <div className="logs-box">

        {logs.length === 0 ? (

          <div className="logs-empty">

            <p>
              No logs available.
            </p>

          </div>

        ) : (

          logs.map((log, index) => (

            <div
              className={`log-line ${getLogType(
                log
              )}`}
              key={index}
            >

              <span className="log-number">
                {String(
                  index + 1
                ).padStart(3, "0")}
              </span>

              <span
                className={`log-tag ${getLogType(
                  log
                )}`}
              >
                {getLogType(log)}
              </span>

              <span className="log-message">
                {log}
              </span>

            </div>

          ))

        )}

        <div className="terminal-cursor"></div>

        <div ref={logsEndRef}></div>

      </div>

    </div>

  );
}

export default LogsViewer;