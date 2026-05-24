import {
  useEffect,
  useState
} from "react";

import socket from "../services/socket";

function useDeploymentSocket(
  deploymentId
) {

  const [statusData, setStatusData] =
    useState(null);

  const [logs, setLogs] =
    useState([]);

  const [
    connectionStatus,
    setConnectionStatus
  ] = useState("connecting");

  useEffect(() => {

    if (!deploymentId)
      return;

    const joinRoom = () => {

      socket.emit(
        "join_deployment",
        {
          deployment_id:
            deploymentId
        }
      );

    };

    /*
      CONNECT
    */

    const handleConnect =
      () => {

        console.log(
          "Socket connected"
        );

        setConnectionStatus(
          "connected"
        );

        joinRoom();
      };

    /*
      DISCONNECT
    */

    const handleDisconnect =
      () => {

        console.log(
          "Socket disconnected"
        );

        setConnectionStatus(
          "disconnected"
        );
      };

    /*
      DEPLOYMENT UPDATE
    */

    const handleDeploymentUpdate =
      (data) => {

        setStatusData(data);
      };

    /*
      LOG UPDATE
    */

    const handleLogUpdate =
      (data) => {

        setLogs((prev) => {

          if (
            prev[
              prev.length - 1
            ] === data.log
          ) {

            return prev;
          }

          return [
            ...prev,
            data.log
          ];

        });
      };

    /*
      REGISTER EVENTS
    */

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "deployment_update",
      handleDeploymentUpdate
    );

    socket.on(
      "log_update",
      handleLogUpdate
    );

    /*
      IF ALREADY CONNECTED
    */

    if (socket.connected) {

      joinRoom();

      setConnectionStatus(
        "connected"
      );

    }

    /*
      CLEANUP
    */

    return () => {

      socket.emit(
        "leave_deployment",
        {
          deployment_id:
            deploymentId
        }
      );

      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
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

    logs,

    connectionStatus

  };

}

export default useDeploymentSocket;