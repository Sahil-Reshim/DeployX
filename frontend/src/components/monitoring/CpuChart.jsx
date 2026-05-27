import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip
} from "recharts";

function CpuChart({ data }) {

  return (

    <div className="chart-card">

      <h3>CPU Usage</h3>

      <ResponsiveContainer
        width="100%"
        height={220}
      >

        <LineChart data={data}>

          <XAxis dataKey="time" hide />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#00e0ff"
            strokeWidth={3}
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}

export default CpuChart;