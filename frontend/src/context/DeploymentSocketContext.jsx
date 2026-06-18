import { createContext, useContext } from "react";

import useDeploymentSocket from "../hooks/useDeploymentSocket";

const DeploymentSocketContext = createContext(null);

export function DeploymentSocketProvider({
  deploymentId,
  children,
}) {
  const socketState = useDeploymentSocket(deploymentId);

  return (
    <DeploymentSocketContext.Provider value={socketState}>
      {children}
    </DeploymentSocketContext.Provider>
  );
}

export function useDeploymentSocketContext() {
  return useContext(DeploymentSocketContext);
}

export default DeploymentSocketContext;
