import {
  useEffect,
  useState,
  useRef
} from "react";

import API from "../services/api";

function LogsViewer({ deploymentId }) {

  const [buildLogs, setBuildLogs] =
    useState([]);

  const [containerLogs, setContainerLogs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [autoScroll, setAutoScroll] =
    useState(true);

  const logsBoxRef = useRef(null);

  const isNearBottom = () => {

    const container =
      logsBoxRef.current;

    if (!container) return true;

    return (
      container.scrollHeight -
        container.scrollTop -
        container.clientHeight <
      120
    );
  };

  const fetchLogs = async () => {

    if (!deploymentId) {
      setLoading(false);
      return;
    }

    try {

      const [
        buildResponse,
        runtimeResponse
      ] = await Promise.all([

        API.get(
          `/deployments/${deploymentId}/logs`
        ),

        API.get(
          `/deployments/${deploymentId}/container-logs`
        )

      ]);

      setBuildLogs(
        buildResponse.data.logs || []
      );

      setContainerLogs(
        runtimeResponse.data.logs || []
      );

      setError("");

    } catch (err) {

      console.error(err);

      setError(
        "Failed to load deployment logs."
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {

    setLoading(true);

    fetchLogs();

    const interval = setInterval(
      fetchLogs,
      3000
    );

    return () =>
      clearInterval(interval);

  }, [deploymentId]);

  useEffect(() => {

    if (
      autoScroll &&
      isNearBottom()
    ) {

      const container =
        logsBoxRef.current;

      if (container) {

        container.scrollTop =
          container.scrollHeight;

      }
    }

  }, [
    buildLogs,
    containerLogs,
    autoScroll
  ]);

  const getLogType = (log) => {

    const lower =
      log.toLowerCase();

    if (
      lower.includes("error") ||
      lower.includes("failed")
    ) {
      return "error";
    }

    if (
      lower.includes("success") ||
      lower.includes("running") ||
      lower.includes("started")
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

  const allLogs = [

    ...buildLogs.map(log => ({
      type: "BUILD",
      message: log
    })),

    ...containerLogs.map(log => ({
      type: "RUNTIME",
      message: log
    }))

  ];

  if (!deploymentId) {

    return (

      <div className="logs-container">

        <div className="logs-empty">

          <p>
            No deployment selected.
          </p>

        </div>

      </div>

    );
  }

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
            setAutoScroll(
              !autoScroll
            )
          }
        >
          {autoScroll
            ? "Auto Scroll ON"
            : "Auto Scroll OFF"}
        </button>

        <button
          className="logs-tool-btn"
          onClick={fetchLogs}
        >
          Refresh Logs
        </button>

        <div className="logs-count">
          {allLogs.length} logs
        </div>

      </div>

      <div
        className="logs-box"
        ref={logsBoxRef}
      >

        {error ? (

          <div className="logs-empty">

            <p>{error}</p>

          </div>

        ) : allLogs.length === 0 ? (

          <div className="logs-empty">

            <p>
              No logs available yet.
            </p>

          </div>

        ) : (

          allLogs.map(
            (log, index) => (

              <div
                className={`log-line ${getLogType(
                  log.message
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
                    log.message
                  )}`}
                >

                  {log.type}

                </span>

                <span className="log-message">

                  {log.message}

                </span>

              </div>

            )
          )

        )}

        <div className="terminal-cursor"></div>

      </div>

    </div>

  );
}

export default LogsViewer;