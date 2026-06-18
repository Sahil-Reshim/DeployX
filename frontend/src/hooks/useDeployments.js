import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

import API from "../services/api";
import { mergeDeploymentRecord } from "../utils/deploymentMerge";

function useDeployments() {
  const [deployments, setDeployments] = useState([]);
  const [latestDeployment, setLatestDeployment] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const hasFetched = useRef(false);
  const latestDeploymentRef = useRef(null);

  useEffect(() => {
    latestDeploymentRef.current = latestDeployment;
  }, [latestDeployment]);

  const fetchDeployments = useCallback(async () => {
    try {
      const response = await API.get("/deployments");

      const deploymentData = Array.isArray(response.data)
        ? response.data
        : response.data.deployments || [];

      const sortedDeployments = deploymentData.sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );

      setDeployments(sortedDeployments);

      if (sortedDeployments.length > 0) {
        setLatestDeployment((prev) =>
          mergeDeploymentRecord(
            prev,
            sortedDeployments[0]
          )
        );
      } else {
        setLatestDeployment(null);
      }
    } catch (error) {
      console.error(
        "Failed to fetch deployments:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const upsertLatestDeployment = useCallback((deploymentOrUpdater) => {
    setLatestDeployment((prev) => {
      const deployment =
        typeof deploymentOrUpdater === "function"
          ? deploymentOrUpdater(prev)
          : deploymentOrUpdater;

      if (!deployment?.id) {
        return prev;
      }

      return mergeDeploymentRecord(prev, deployment);
    });

    setDeployments((prev) => {
      const deployment =
        typeof deploymentOrUpdater === "function"
          ? deploymentOrUpdater(
              latestDeploymentRef.current
            )
          : deploymentOrUpdater;

      if (!deployment?.id) {
        return prev;
      }

      const exists = prev.some(
        (item) =>
          Number(item.id) === Number(deployment.id)
      );

      if (!exists) {
        return [deployment, ...prev];
      }

      return prev.map((item) =>
        Number(item.id) === Number(deployment.id)
          ? mergeDeploymentRecord(item, deployment)
          : item
      );
    });
  }, []);

  const updateDeploymentStatus = (
    deploymentId,
    newStatus
  ) => {
    setDeployments((prev) =>
      prev.map((deployment) => {
        if (deployment.id === deploymentId) {
          return {
            ...deployment,
            status: newStatus,
          };
        }

        return deployment;
      })
    );

    setLatestDeployment((prev) => {
      if (prev?.id === deploymentId) {
        return {
          ...prev,
          status: newStatus,
        };
      }

      return prev;
    });
  };

  const startDeployment = async (deploymentId) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [deploymentId]: "starting",
      }));

      updateDeploymentStatus(deploymentId, "running");

      await API.post(
        `/deployment/${deploymentId}/start`
      );

      fetchDeployments();
    } catch (error) {
      console.error(
        "Start deployment error:",
        error
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [deploymentId]: null,
      }));
    }
  };

  const stopDeployment = async (deploymentId) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [deploymentId]: "stopping",
      }));

      updateDeploymentStatus(deploymentId, "stopped");

      await API.post(
        `/deployment/${deploymentId}/stop`
      );

      fetchDeployments();
    } catch (error) {
      console.error(
        "Stop deployment error:",
        error
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [deploymentId]: null,
      }));
    }
  };

  const restartDeployment = async (deploymentId) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [deploymentId]: "restarting",
      }));

      updateDeploymentStatus(
        deploymentId,
        "restarting"
      );

      await API.post(
        `/deployment/${deploymentId}/restart`
      );

      fetchDeployments();
    } catch (error) {
      console.error(
        "Restart deployment error:",
        error
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [deploymentId]: null,
      }));
    }
  };

  const deleteDeployment = async (deploymentId) => {
    try {
      await API.delete(
        `/deployments/${deploymentId}`
      );

      setDeployments((prev) =>
        prev.filter(
          (deployment) =>
            deployment.id !== deploymentId
        )
      );

      if (
        latestDeploymentRef.current?.id ===
        deploymentId
      ) {
        setLatestDeployment(null);
      }

      fetchDeployments();
    } catch (error) {
      console.error(
        "Delete deployment error:",
        error
      );
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchDeployments();
    }
  }, [fetchDeployments]);

  return {
    deployments,
    latestDeployment,
    setLatestDeployment,
    upsertLatestDeployment,
    loading,
    fetchDeployments,
    deleteDeployment,
    startDeployment,
    stopDeployment,
    restartDeployment,
    actionLoading,
  };
}

export default useDeployments;
