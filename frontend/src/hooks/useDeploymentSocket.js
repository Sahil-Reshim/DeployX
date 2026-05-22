import { useEffect, useState } from "react";

import socket from "../sockets/socket";

function useDeploymentSocket(
  deploymentId
) {

  const [statusData, setStatusData] =
    useState(null);

  const [logs, setLogs] =
    useState([]);

  useEffect(() => {

    if (!deploymentId)
      return;

    socket.emit(
      "join_deployment",
      {
        deployment_id:
          deploymentId
      }
    );

    const handleDeploymentUpdate =
      (data) => {

        setStatusData(data);
      };

    const handleLogUpdate =
      (data) => {

        setLogs(
          prev => [
            ...prev,
            data.log
          ]
        );
      };

    socket.on(
      "deployment_update",
      handleDeploymentUpdate
    );

    socket.on(
      "log_update",
      handleLogUpdate
    );

    return () => {

      socket.emit(
        "leave_deployment",
        {
          deployment_id:
            deploymentId
        }
      );

      socket.off(
        "deployment_update",
        handleDeploymentUpdate
      );

      socket.off(
        "log_update",
        handleLogUpdate
      );

    };

  }, [deploymentId]);

  return {
    statusData,
    logs
  };

}

export default useDeploymentSocket;