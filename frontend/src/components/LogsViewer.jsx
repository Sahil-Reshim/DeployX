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

  /* ─────────────────────────────────────────────
     AUTO SCROLL
  ───────────────────────────────────────────── */

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

  /* ─────────────────────────────────────────────
     FETCH LOGS
  ───────────────────────────────────────────── */

  const fetchLogs = async () => {

    if (!deploymentId) {

      setLoading(false);

      return;
    }

    try {

      setLoading(true);

      let buildData = [];
      let runtimeData = [];

      /*
        BUILD LOGS
      */

      try {

        const buildResponse =
          await API.get(
            `/deployments/${deploymentId}/logs`
          );

        buildData =
          buildResponse.data.logs || [];

      } catch (error) {

        /*
          Backend now returns 404
          while logs are generating
        */

        if (
          error.response?.status === 404
        ) {

          buildData = [
            "Build logs not ready yet..."
          ];

        } else {

          throw error;
        }
      }

      /*
        CONTAINER LOGS
      */

      try {

        const runtimeResponse =
          await API.get(
            `/deployments/${deploymentId}/container-logs`
          );

        runtimeData =
          runtimeResponse.data.logs || [];

      } catch (error) {

        if (
          error.response?.status === 404
        ) {

          runtimeData = [
            "Container logs not ready yet..."
          ];

        } else {

          throw error;
        }
      }

      setBuildLogs(buildData);

      setContainerLogs(runtimeData);

      setError("");

    } catch (err) {

      console.error(
        "Failed to fetch logs:",
        err
      );

      setError(
        "Failed to load deployment logs."
      );

    } finally {

      setLoading(false);

    }
  };

  /* ─────────────────────────────────────────────
     POLLING
  ───────────────────────────────────────────── */

  useEffect(() => {

    if (!deploymentId) return;

    fetchLogs();

    const interval = setInterval(
      fetchLogs,
      3000
    );

    return () =>
      clearInterval(interval);

  }, [deploymentId]);

  /* ─────────────────────────────────────────────
     AUTO SCROLL EFFECT
  ───────────────────────────────────────────── */

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

  /* ─────────────────────────────────────────────
     LOG COLORS
  ───────────────────────────────────────────── */

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

  /* ─────────────────────────────────────────────
     MERGED LOGS
  ───────────────────────────────────────────── */

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

  /* ─────────────────────────────────────────────
     EMPTY STATE
  ───────────────────────────────────────────── */

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

  /* ─────────────────────────────────────────────
     LOADING
  ───────────────────────────────────────────── */

  if (loading && allLogs.length === 0) {

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

  /* ─────────────────────────────────────────────
     MAIN UI
  ───────────────────────────────────────────── */

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
              Logs not ready yet...
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