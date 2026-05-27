import {
  useEffect,
  useRef,
  useState
} from "react";

import API from "../services/api";

import useDeploymentSocket from "../hooks/useDeploymentSocket";

import "../styles/logs.css";

function LogsViewer({
  deploymentId
}) {

  const [logs, setLogs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const logsBoxRef =
    useRef(null);

  const {
    logs: liveLogs
  } = useDeploymentSocket(
    deploymentId
  );

  /* ─────────────────────────────────────────────
     FORMAT LOG TYPE
  ───────────────────────────────────────────── */

  const getLogType = (
    log
  ) => {

    if (!log)
      return "info";

    const text =
      log.toLowerCase();

    if (
      text.includes("error") ||
      text.includes("failed") ||
      text.includes("exception")
    ) {

      return "error";

    }

    if (
      text.includes("success") ||
      text.includes("live") ||
      text.includes("running") ||
      text.includes("completed")
    ) {

      return "success";

    }

    if (
      text.includes("warning") ||
      text.includes("warn")
    ) {

      return "warn";

    }

    return "info";

  };

  /* ─────────────────────────────────────────────
     LOAD INITIAL LOGS
  ───────────────────────────────────────────── */

  useEffect(() => {

    async function loadLogs() {

      if (!deploymentId)
        return;

      try {

        setLoading(true);

        const buildResponse =
          await API.get(
            `/deployments/${deploymentId}/logs`
          );

        let containerLogs =
          [];

        try {

          const containerResponse =
            await API.get(
              `/deployments/${deploymentId}/container-logs`
            );

          containerLogs =
            containerResponse.data
              ?.logs || [];

        } catch {

          containerLogs = [];

        }

        const buildLogs =
          buildResponse.data
            ?.logs || [];

        const mergedLogs = [

          ...buildLogs,
          ...containerLogs

        ];

        setLogs(mergedLogs);

      } catch (error) {

        console.error(
          "Failed loading logs:",
          error
        );

      } finally {

        setLoading(false);

      }

    }

    loadLogs();

  }, [deploymentId]);

  /* ─────────────────────────────────────────────
     LIVE SOCKET LOGS
  ───────────────────────────────────────────── */

  useEffect(() => {

    if (
      !liveLogs ||
      liveLogs.length === 0
    )
      return;

    const latestLog =
      liveLogs[
        liveLogs.length - 1
      ];

    setLogs((prev) => [

      ...prev,
      latestLog

    ]);

  }, [liveLogs]);

  /* ─────────────────────────────────────────────
     AUTO SCROLL
  ───────────────────────────────────────────── */

  useEffect(() => {

    if (
      logsBoxRef.current
    ) {

      logsBoxRef.current.scrollTop =
        logsBoxRef.current
          .scrollHeight;

    }

  }, [logs]);

  /* ─────────────────────────────────────────────
     CLEAR LOGS
  ───────────────────────────────────────────── */

  const clearLogs = () => {

    setLogs([]);

  };

  /* ─────────────────────────────────────────────
     COPY LOGS
  ───────────────────────────────────────────── */

  const copyLogs = async () => {

    try {

      await navigator.clipboard.writeText(
        logs.join("\n")
      );

    } catch (error) {

      console.error(
        "Failed to copy logs",
        error
      );

    }

  };

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */

  return (

    <div className="logs-container">

      {/* HEADER */}

      <div className="logs-header">

        <div className="logs-header-left">

          <div className="logs-dots">

            <span className="logs-dot red"></span>

            <span className="logs-dot yellow"></span>

            <span className="logs-dot green"></span>

          </div>

          <div className="logs-title">

            deployx-runtime.logs

          </div>

        </div>

        <div className="logs-status">

          <span className="logs-status-dot"></span>

          LIVE STREAM

        </div>

      </div>

      {/* TOOLBAR */}

      <div className="logs-toolbar">

        <div
          style={{
            display: "flex",
            gap: "10px"
          }}
        >

          <button
            className="logs-tool-btn"
            onClick={copyLogs}
          >

            Copy

          </button>

          <button
            className="logs-tool-btn"
            onClick={clearLogs}
          >

            Clear

          </button>

        </div>

        <div className="logs-count">

          {logs.length}
          {" "}
          ENTRIES

        </div>

      </div>

      {/* LOADING */}

      {

        loading ? (

          <div className="logs-loading">

            <div className="terminal-loader"></div>

            <p>
              Loading deployment logs...
            </p>

          </div>

        ) : (

          <div
            className="logs-box"
            ref={logsBoxRef}
          >

            {

              logs.length === 0 ? (

                <div className="logs-empty">

                  <p>
                    Waiting for logs...
                  </p>

                </div>

              ) : (

                logs.map(
                  (
                    log,
                    index
                  ) => {

                    const type =
                      getLogType(
                        log
                      );

                    return (

                      <div
                        key={index}
                        className={`log-line ${type}`}
                      >

                        <div className="log-number">

                          {String(
                            index + 1
                          ).padStart(
                            3,
                            "0"
                          )}

                        </div>

                        <div
                          className={`log-tag ${type}`}
                        >

                          {type}

                        </div>

                        <div className="log-message">

                          {log}

                          {

                            index ===
                              logs.length -
                                1 && (

                              <span className="terminal-cursor"></span>

                            )

                          }

                        </div>

                      </div>

                    );

                  }
                )

              )

            }

          </div>

        )

      }

    </div>

  );

}

export default LogsViewer;