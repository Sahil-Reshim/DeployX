import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  XAxis
} from "recharts";

function NetworkChart({ data }) {

  return (

    <div className="chart-card">

      <h3>Network Activity</h3>

      <ResponsiveContainer
        width="100%"
        height={220}
      >

        <LineChart data={data}>

          <XAxis dataKey="time" hide />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="rx"
            stroke="#00ff99"
            strokeWidth={3}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="tx"
            stroke="#ff6b6b"
            strokeWidth={3}
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}

export default NetworkChart;