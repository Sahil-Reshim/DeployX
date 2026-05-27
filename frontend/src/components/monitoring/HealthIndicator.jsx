function HealthIndicator({
  health = "healthy"
}) {

  return (

    <div className={`health-indicator ${health}`}>

      <span className="health-dot"></span>

      {health.toUpperCase()}

    </div>

  );

}

export default HealthIndicator;