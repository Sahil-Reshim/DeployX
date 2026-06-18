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
      // Temporary debug: log incoming socket payload
      try {
        console.log("Socket payload:", data);
      } catch (e) {}
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
      try {
        console.log("Socket connected:", socket.id, socket.connected);
      } catch (e) {}
      joinRoom();
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
      try {
        console.log("Socket disconnected:", socket.id, socket.connected);
      } catch (e) {}
    };

    const handleConnectError = (error) => {
      console.error("Socket connect_error:", error);
      setConnectionStatus("error");
    };

    const handleLogUpdate = (data) => {
      if (
        data?.deployment_id != null &&
        Number(data.deployment_id) !== Number(deploymentId)
      ) {
        return;
      }

      setLogs((prev) => {
        if (prev[prev.length - 1] === data.log) {
          return prev;
        }

        return [...prev, data.log];
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
