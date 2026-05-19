import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import API from "../services/api";

function LogsViewer({
  deploymentId
}) {

  /*
    STATE
  */

  const [buildLogs, setBuildLogs] =
    useState([]);

  const [
    containerLogs,
    setContainerLogs
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [autoScroll, setAutoScroll] =
    useState(true);

  const [connected, setConnected] =
    useState(false);

  const logsRef = useRef(null);

  const pollingRef = useRef(null);

  /*
    AUTO SCROLL
  */

  const scrollToBottom = () => {

    const container =
      logsRef.current;

    if (!container) return;

    container.scrollTop =
      container.scrollHeight;
  };

  const shouldAutoScroll =
    () => {

      const container =
        logsRef.current;

      if (!container)
        return true;

      return (
        container.scrollHeight -
          container.scrollTop -
          container.clientHeight <
        140
      );
    };

  /*
    FORMAT TIME
  */

  const getTime = () => {

    return new Date()
      .toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
  };

  /*
    LOG TYPE
  */

  const getLogType = (
    log = ""
  ) => {

    const lower =
      log.toLowerCase();

    if (
      lower.includes("error") ||
      lower.includes("failed") ||
      lower.includes("exception")
    ) {
      return "error";
    }

    if (
      lower.includes("warning") ||
      lower.includes("warn")
    ) {
      return "warn";
    }

    if (
      lower.includes("success") ||
      lower.includes("running") ||
      lower.includes("started") ||
      lower.includes("listening")
    ) {
      return "success";
    }

    return "info";
  };

  /*
    DEDUPLICATE
  */

  const deduplicateLogs = (
    logs
  ) => {

    return [
      ...new Map(
        logs.map((log) => [
          log.message,
          log,
        ])
      ).values(),
    ];
  };

  /*
    FETCH LOGS
  */

  const fetchLogs = async () => {

    if (!deploymentId) {

      setLoading(false);

      return;
    }

    try {

      setConnected(true);

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
          (
            buildResponse.data
              ?.logs || []
          ).map((log) => ({
            type: "BUILD",
            message: log,
            timestamp:
              getTime(),
          }));

      } catch (error) {

        if (
          error.response
            ?.status === 404
        ) {

          buildData = [
            {
              type: "BUILD",
              message:
                "Waiting for build logs...",
              timestamp:
                getTime(),
            },
          ];

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
          (
            runtimeResponse.data
              ?.logs || []
          ).map((log) => ({
            type: "RUNTIME",
            message: log,
            timestamp:
              getTime(),
          }));

      } catch (error) {

        if (
          error.response
            ?.status === 404
        ) {

          runtimeData = [
            {
              type: "RUNTIME",
              message:
                "Container runtime not started yet...",
              timestamp:
                getTime(),
            },
          ];

        }
      }

      setBuildLogs(buildData);

      setContainerLogs(
        runtimeData
      );

      setError("");

    } catch (error) {

      console.error(error);

      setConnected(false);

      setError(
        "Unable to connect to deployment runtime."
      );

    } finally {

      setLoading(false);

    }
  };

  /*
    POLLING
  */

  useEffect(() => {

    if (!deploymentId)
      return;

    fetchLogs();

    pollingRef.current =
      setInterval(() => {

        fetchLogs();

      }, 2500);

    return () => {

      if (
        pollingRef.current
      ) {

        clearInterval(
          pollingRef.current
        );

      }
    };

  }, [deploymentId]);

  /*
    MERGED LOGS
  */

  const mergedLogs =
    useMemo(() => {

      return deduplicateLogs([
        ...buildLogs,
        ...containerLogs,
      ]);

    }, [
      buildLogs,
      containerLogs,
    ]);

  /*
    AUTO SCROLL EFFECT
  */

  useEffect(() => {

    if (
      autoScroll &&
      shouldAutoScroll()
    ) {

      scrollToBottom();

    }

  }, [
    mergedLogs,
    autoScroll,
  ]);

  /*
    EMPTY STATE
  */

  if (!deploymentId) {

    return (

      <div className="logs-container empty">

        <div className="logs-empty-state">

          <div className="empty-terminal-icon">

            ⚡

          </div>

          <h3>
            Runtime Logs Unavailable
          </h3>

          <p>
            Deploy a repository to
            start live terminal
            streaming.
          </p>

        </div>

      </div>

    );
  }

  /*
    MAIN UI
  */

  return (

    <div className="logs-container">

      {/* TOP BAR */}

      <div className="logs-header">

        <div className="logs-header-left">

          <div className="terminal-controls">

            <span className="control red"></span>

            <span className="control yellow"></span>

            <span className="control green"></span>

          </div>

          <div className="logs-runtime-info">

            <span className="runtime-title">

              deployx-runtime

            </span>

            <span className="runtime-subtitle">

              live deployment logs

            </span>

          </div>

        </div>

        <div className="logs-header-right">

          <div
            className={`runtime-status ${
              connected
                ? "online"
                : "offline"
            }`}
          >

            <span className="runtime-pulse"></span>

            {connected
              ? "CONNECTED"
              : "OFFLINE"}

          </div>

        </div>

      </div>

      {/* TOOLBAR */}

      <div className="logs-toolbar">

        <button
          className={`logs-toolbar-btn ${
            autoScroll
              ? "active"
              : ""
          }`}
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
          className="logs-toolbar-btn"
          onClick={fetchLogs}
        >

          Refresh

        </button>

        <div className="logs-counter">

          {mergedLogs.length}
          {" "}entries

        </div>

      </div>

      {/* TERMINAL */}

      <div
        className="logs-box"
        ref={logsRef}
      >

        {loading &&
        mergedLogs.length ===
          0 ? (

          <div className="terminal-loading">

            <div className="terminal-loader"></div>

            <p>
              Connecting to runtime...
            </p>

          </div>

        ) : error ? (

          <div className="terminal-error">

            {error}

          </div>

        ) : mergedLogs.length ===
          0 ? (

          <div className="terminal-empty">

            Waiting for logs...

          </div>

        ) : (

          mergedLogs.map(
            (
              log,
              index
            ) => (

              <div
                key={`${log.message}-${index}`}
                className={`log-line ${getLogType(
                  log.message
                )}`}
              >

                <span className="log-time">

                  {log.timestamp}

                </span>

                <span
                  className={`log-badge ${log.type.toLowerCase()}`}
                >

                  {log.type}

                </span>

                <span className="log-index">

                  {String(
                    index + 1
                  ).padStart(
                    3,
                    "0"
                  )}

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