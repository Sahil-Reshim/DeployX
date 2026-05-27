import {
  useState,
  useEffect,
  useRef
} from "react";

import API from "../services/api";

function useDeployments() {

  const [deployments, setDeployments] =
    useState([]);

  const [latestDeployment, setLatestDeployment] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  /*
  ─────────────────────────────────────────────
  PHASE 7 ACTION LOADING
  ─────────────────────────────────────────────
  */

  const [actionLoading, setActionLoading] =
    useState({});

  const hasFetched = useRef(false);

  /*
  ─────────────────────────────────────────────
  FETCH DEPLOYMENTS
  ─────────────────────────────────────────────
  */

  const fetchDeployments =
    async () => {

      try {

        const response =
          await API.get(
            "/deployments"
          );

        const deploymentData =
          Array.isArray(
            response.data
          )
            ? response.data
            : response.data
                .deployments || [];

        const sortedDeployments =
          deploymentData.sort(
            (a, b) =>
              new Date(
                b.created_at || 0
              ) -
              new Date(
                a.created_at || 0
              )
          );

        setDeployments(
          sortedDeployments
        );

        if (
          sortedDeployments.length >
          0
        ) {

          setLatestDeployment(
            sortedDeployments[0]
          );

        } else {

          setLatestDeployment(
            null
          );

        }

      } catch (error) {

        console.error(
          "Failed to fetch deployments:",
          error
        );

      } finally {

        setLoading(false);

      }

    };

  /*
  ─────────────────────────────────────────────
  UPDATE STATUS
  ─────────────────────────────────────────────
  */

  const updateDeploymentStatus =
    (
      deploymentId,
      newStatus
    ) => {

      setDeployments((prev) =>

        prev.map((deployment) => {

          if (
            deployment.id ===
            deploymentId
          ) {

            return {
              ...deployment,
              status: newStatus
            };

          }

          return deployment;

        })

      );

      setLatestDeployment((prev) => {

        if (
          prev?.id ===
          deploymentId
        ) {

          return {
            ...prev,
            status: newStatus
          };

        }

        return prev;

      });

    };

  /*
  ─────────────────────────────────────────────
  START DEPLOYMENT
  ─────────────────────────────────────────────
  */

  const startDeployment =
    async (deploymentId) => {

      try {

        setActionLoading((prev) => ({
          ...prev,
          [deploymentId]:
            "starting"
        }));

        /*
        OPTIMISTIC UI
        */

        updateDeploymentStatus(
          deploymentId,
          "running"
        );

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
          [deploymentId]:
            null
        }));

      }

    };

  /*
  ─────────────────────────────────────────────
  STOP DEPLOYMENT
  ─────────────────────────────────────────────
  */

  const stopDeployment =
    async (deploymentId) => {

      try {

        setActionLoading((prev) => ({
          ...prev,
          [deploymentId]:
            "stopping"
        }));

        /*
        OPTIMISTIC UI
        */

        updateDeploymentStatus(
          deploymentId,
          "stopped"
        );

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
          [deploymentId]:
            null
        }));

      }

    };

  /*
  ─────────────────────────────────────────────
  RESTART DEPLOYMENT
  ─────────────────────────────────────────────
  */

  const restartDeployment =
    async (deploymentId) => {

      try {

        setActionLoading((prev) => ({
          ...prev,
          [deploymentId]:
            "restarting"
        }));

        /*
        OPTIMISTIC UI
        */

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
          [deploymentId]:
            null
        }));

      }

    };

  /*
  ─────────────────────────────────────────────
  DELETE DEPLOYMENT
  ─────────────────────────────────────────────
  */

  const deleteDeployment =
    async (deploymentId) => {

      try {

        await API.delete(
          `/deployments/${deploymentId}`
        );

        setDeployments((prev) =>

          prev.filter(

            (deployment) =>

              deployment.id !==
              deploymentId

          )

        );

        if (
          latestDeployment?.id ===
          deploymentId
        ) {

          setLatestDeployment(
            null
          );

        }

        fetchDeployments();

      } catch (error) {

        console.error(
          "Delete deployment error:",
          error
        );

      }

    };

  /*
  ─────────────────────────────────────────────
  INITIAL LOAD
  ─────────────────────────────────────────────
  */

  useEffect(() => {

    if (!hasFetched.current) {

      hasFetched.current = true;

      fetchDeployments();

    }

  }, []);

  return {

    deployments,

    latestDeployment,

    setLatestDeployment,

    loading,

    fetchDeployments,

    deleteDeployment,

    startDeployment,

    stopDeployment,

    restartDeployment,

    actionLoading

  };

}

export default useDeployments;