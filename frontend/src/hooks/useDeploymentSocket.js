import {
  useEffect,
  useState,
  useCallback,
} from "react";

import socket from "../services/socket";
import { mergeSocketUpdate } from "../utils/deploymentMerge";

function useDeploymentSocket(deploymentId) {
  const [statusData, setStatusData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [connectionStatus, setConnectionStatus] =
    useState("connecting");

  const handleDeploymentUpdate = useCallback(
    (data) => {
      if (!deploymentId) {
        return;
      }

      if (
        data?.deployment_id != null &&
        Number(data.deployment_id) !== Number(deploymentId)
      ) {
        return;
      }

      setStatusData((prev) =>
        mergeSocketUpdate(prev, data)
      );
    },
    [deploymentId]
  );

  useEffect(() => {
    if (!deploymentId) {
      setStatusData(null);
      return;
    }

    const joinRoom = () => {
      socket.emit("join_deployment", {
        deployment_id: deploymentId,
      });
    };

    const handleConnect = () => {
      setConnectionStatus("connected");
      joinRoom();
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
    };

    const handleConnectError = (error) => {
      console.error("Socket connect_error:", error);
      setConnectionStatus("error");
      joinRoom();
    };
   

    const handleLogUpdate = (data) => {
      if (
        data?.deployment_id != null &&
        Number(data.deployment_id) !== Number(deploymentId)
      ) {
        return;
      }

      // Ensure log is a structured object { message, level, timestamp }
      const raw = data.log;

      const entry = (() => {
        if (!raw) return null;
        if (typeof raw === "string") {
          const text = raw;
          const lt = text.toLowerCase();
          const level = lt.includes("error") || lt.includes("failed") || lt.includes("exception")
            ? "error"
            : lt.includes("success") || lt.includes("completed") || lt.includes("running")
            ? "success"
            : lt.includes("warn") || lt.includes("warning")
            ? "warn"
            : "info";

          return {
            message: text,
            level,
            timestamp: new Date().toISOString(),
          };
        }

        // assume object-like
        return {
          message: String(raw.message ?? raw.msg ?? ""),
          level: raw.level ?? raw.level_name ?? "info",
          timestamp: raw.timestamp ?? new Date().toISOString(),
        };
      })();

      if (!entry) return;

      setLogs((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.message === entry.message && last.timestamp === entry.timestamp) return prev;
        return [...prev, entry];
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("deployment_update", handleDeploymentUpdate);
    socket.on("log_update", handleLogUpdate);

    if (socket.connected) {
      joinRoom();
      setConnectionStatus("connected");
    }

    return () => {
      socket.emit("leave_deployment", {
        deployment_id: deploymentId,
      });

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("deployment_update", handleDeploymentUpdate);
      socket.off("log_update", handleLogUpdate);
    };
  }, [deploymentId, handleDeploymentUpdate]);

  return {
    statusData,
    logs,
    connectionStatus,
  };
}

export default useDeploymentSocket;
