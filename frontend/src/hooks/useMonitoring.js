import { useEffect, useState } from "react";

function useMonitoring(statusData) {

  const [metrics, setMetrics] =
    useState({
      cpu: 0,
      ram: 0,
      network_rx: 0,
      network_tx: 0,
      health: "healthy",
    });

  const [cpuHistory, setCpuHistory] =
    useState([]);

  const [ramHistory, setRamHistory] =
    useState([]);

  const [networkHistory, setNetworkHistory] =
    useState([]);

  useEffect(() => {

    const liveMetrics =
      statusData?.metrics;

    if (!liveMetrics)
      return;

    const cpu =
      Number(liveMetrics.cpu || 0);

    const ram =
      Number(liveMetrics.ram || 0);

    const network_rx =
      Number(liveMetrics.network_rx || 0);

    const network_tx =
      Number(liveMetrics.network_tx || 0);

    setMetrics({
      cpu,
      ram,
      network_rx,
      network_tx,
      health:
        liveMetrics.health ||
        "healthy",
    });

    const timestamp =
      new Date().toLocaleTimeString();

    setCpuHistory((prev) => [
      ...prev.slice(-29),
      {
        time: timestamp,
        value: cpu,
      },
    ]);

    setRamHistory((prev) => [
      ...prev.slice(-29),
      {
        time: timestamp,
        value: ram,
      },
    ]);

    setNetworkHistory((prev) => [
      ...prev.slice(-29),
      {
        time: timestamp,
        rx: network_rx,
        tx: network_tx,
      },
    ]);

  }, [statusData]);

  return {
    metrics,
    cpuHistory,
    ramHistory,
    networkHistory,
  };

}

export default useMonitoring;