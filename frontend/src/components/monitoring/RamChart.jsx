import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis
} from "recharts";

function RamChart({ data }) {

  return (

    <div className="chart-card">

      <h3>RAM Usage</h3>

      <ResponsiveContainer
        width="100%"
        height={220}
      >

        <AreaChart data={data}>

          <XAxis dataKey="time" hide />

          <Tooltip />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#8b5cf6"
            fill="#8b5cf633"
          />

        </AreaChart>

      </ResponsiveContainer>

    </div>

  );

}

export default RamChart;