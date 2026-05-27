import { motion } from "framer-motion";

function MetricCard({
  title,
  value,
  icon
}) {

  return (

    <motion.div
      className="metric-card"
      whileHover={{
        y: -4
      }}
    >

      <div className="metric-header">

        <span className="metric-title">
          {title}
        </span>

        <div className="metric-icon">
          {icon}
        </div>

      </div>

      <h2 className="metric-value">
        {value}
      </h2>

      <div className="metric-live">

        <span className="live-dot"></span>

        LIVE

      </div>

    </motion.div>

  );

}

export default MetricCard;