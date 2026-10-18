function StatusBadge({ status }) {

  /*
    NORMALIZE STATUS
  */

  const normalized =
    (
      status ||
      "offline"
    ).toLowerCase();

  /*
    STATUS CONFIG
  */

  const statusConfig = {

    queued: {
      label: "Queued",
      icon: "⏳",
      pulse: true,
    },

    cloning: {
      label: "Building",
      icon: "📂",
      pulse: true,
    },

    detecting: {
      label: "Building",
      icon: "🧠",
      pulse: true,
    },

    dockerfile_generating: {
      label:
        "Building",
      icon: "📝",
      pulse: true,
    },

    ci_pipeline: {
      label: "Building",
      icon: "🐳",
      pulse: true,
    },

    docker_build: {
      label: "Building",
      icon: "🐳",
      pulse: true,
    },

    building: {
      label: "Building",
      icon: "🐳",
      pulse: true,
    },

    deploying: {
      label: "Deploying",
      icon: "⚡",
      pulse: true,
    },

    running: {
      label: "Live",
      icon: "🟢",
      pulse: true,
    },

    success: {
      label: "Success",
      icon: "✅",
      pulse: true,
    },

    live: {
      label: "Live",
      icon: "🌍",
      pulse: true,
    },

    completed: {
      label:
        "Completed",
      icon: "🚀",
      pulse: false,
    },

    failed: {
      label: "Failed",
      icon: "❌",
      pulse: false,
    },

    offline: {
      label: "Offline",
      icon: "⚫",
      pulse: false,
    },

  };

  /*
    FALLBACK
  */

  const currentStatus =
    statusConfig[
      normalized
    ] ||
    statusConfig.offline;

  return (

    <div
      className={`status-badge ${normalized}`}
    >

      {/* GLOW */}

      <div className="status-badge-glow"></div>

      {/* PULSE */}

      {currentStatus.pulse && (

        <div className="status-pulse-ring"></div>

      )}

      {/* DOT */}

      <div
        className={`status-dot ${normalized}`}
      ></div>

      {/* ICON */}

      <span className="status-icon">

        {currentStatus.icon}

      </span>

      {/* LABEL */}

      <span className="status-label">

        {currentStatus.label}

      </span>

    </div>

  );
}

export default StatusBadge;