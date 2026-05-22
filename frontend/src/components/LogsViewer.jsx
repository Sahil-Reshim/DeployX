import {
  useEffect,
  useState
} from "react";

import API from "../services/api";

import useDeploymentSocket
from "../hooks/useDeploymentSocket";

function LogsViewer({
  deploymentId
}) {

  const [logs, setLogs] =
    useState([]);

  const {
    logs: liveLogs
  } = useDeploymentSocket(
    deploymentId
  );

  /* ─────────────────────────────────────────────
     LOAD EXISTING LOGS
  ───────────────────────────────────────────── */

  useEffect(() => {

    async function loadLogs() {

      if (!deploymentId)
        return;

      try {

        const buildResponse =
          await API.get(
            `/deployments/${deploymentId}/logs`
          );

        const containerResponse =
          await API.get(
            `/deployments/${deploymentId}/container-logs`
          );

        const buildLogs =
          buildResponse.data.logs || [];

        const containerLogs =
          containerResponse.data.logs || [];

        setLogs([
          ...buildLogs,
          ...containerLogs
        ]);

      } catch (error) {

        console.error(
          "Failed loading logs:",
          error
        );

      }

    }

    loadLogs();

  }, [deploymentId]);


  /* ─────────────────────────────────────────────
     LIVE SOCKET LOGS
  ───────────────────────────────────────────── */

  useEffect(() => {

    if (
      liveLogs.length === 0
    )
      return;

    const latestLog =
      liveLogs[
        liveLogs.length - 1
      ];

    setLogs(prev => [

      ...prev,
      latestLog

    ]);

  }, [liveLogs]);


  /* ─────────────────────────────────────────────
     AUTO SCROLL INSIDE LOG BOX
  ───────────────────────────────────────────── */

  useEffect(() => {

    const container =
      document.querySelector(
        ".logs-container"
      );

    if (!container)
      return;

    container.scrollTop =
      container.scrollHeight;

  }, [logs]);


  /* ─────────────────────────────────────────────
     UI
  ───────────────────────────────────────────── */

  return (

    <div className="logs-container">

      {

        logs.length === 0 ? (

          <div className="log-line">

            Waiting for logs...

          </div>

        ) : (

          logs.map(
            (log, index) => (

              <div
                key={index}
                className="log-line"
              >

                {log}

              </div>

            )
          )

        )

      }

    </div>

  );

}

export default LogsViewer;