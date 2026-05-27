import {
  useEffect,
  useState
} from "react";

function useMonitoring(
  statusData
) {

  const [metrics, setMetrics] =
    useState({
      cpu: 0,
      ram: 0,
      network_rx: 0,
      network_tx: 0,
      health: "healthy"
    });

  const [cpuHistory, setCpuHistory] =
    useState([]);

  const [ramHistory, setRamHistory] =
    useState([]);

  const [
    networkHistory,
    setNetworkHistory
  ] = useState([]);

  /*
  ─────────────────────────────────────────────
  LIVE MONITORING
  ─────────────────────────────────────────────
  */

  useEffect(() => {

    if (
      !statusData ||
      !statusData.metrics
    ) {
      return;
    }

    const liveMetrics =
      statusData.metrics;

    /*
    SET METRICS
    */

    setMetrics({

      cpu:
        liveMetrics.cpu || 0,

      ram:
        liveMetrics.ram || 0,

      network_rx:
        liveMetrics.network_rx || 0,

      network_tx:
        liveMetrics.network_tx || 0,

      health:
        liveMetrics.health ||
        "healthy"

    });

    /*
    CPU HISTORY
    */

    setCpuHistory((prev) => [

      ...prev.slice(-20),

      {
        time:
          new Date()
            .toLocaleTimeString(),

        value:
          liveMetrics.cpu || 0
      }

    ]);

    /*
    RAM HISTORY
    */

    setRamHistory((prev) => [

      ...prev.slice(-20),

      {
        time:
          new Date()
            .toLocaleTimeString(),

        value:
          liveMetrics.ram || 0
      }

    ]);

    /*
    NETWORK HISTORY
    */

    setNetworkHistory((prev) => [

      ...prev.slice(-20),

      {
        time:
          new Date()
            .toLocaleTimeString(),

        rx:
          liveMetrics.network_rx || 0,

        tx:
          liveMetrics.network_tx || 0
      }

    ]);

  }, [statusData]);

  return {

    metrics,

    cpuHistory,

    ramHistory,

    networkHistory

  };

}

export default useMonitoring;