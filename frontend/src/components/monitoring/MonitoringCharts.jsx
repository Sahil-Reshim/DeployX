import CpuChart from "./CpuChart";
import RamChart from "./RamChart";
import NetworkChart from "./NetworkChart";

function MonitoringCharts({
  cpuHistory,
  ramHistory,
  networkHistory
}) {

  return (

    <div className="charts-grid">

      <CpuChart
        data={cpuHistory}
      />

      <RamChart
        data={ramHistory}
      />

      <NetworkChart
        data={networkHistory}
      />

    </div>

  );

}

export default MonitoringCharts;