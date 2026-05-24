import MetricCard from "./MetricCard";

import {
  Cpu,
  MemoryStick,
  Download,
  Upload
} from "lucide-react";

function MonitoringGrid({ metrics }) {

  return (

    <div className="metrics-grid">

      <MetricCard
        title="CPU Usage"
        value={`${metrics.cpu || 0}%`}
        icon={<Cpu size={22} />}
      />

      <MetricCard
        title="RAM Usage"
        value={`${metrics.ram || 0} MB`}
        icon={<MemoryStick size={22} />}
      />

      <MetricCard
        title="Network RX"
        value={`${metrics.network_rx || 0} KB/s`}
        icon={<Download size={22} />}
      />

      <MetricCard
        title="Network TX"
        value={`${metrics.network_tx || 0} KB/s`}
        icon={<Upload size={22} />}
      />

    </div>

  );

}

export default MonitoringGrid;