function StatusBadge({ status }) {
  const normalized = (status || "offline").toLowerCase();

  return (
    <span className={`status-badge ${normalized}`}>
      {normalized}
    </span>
  );
}

export default StatusBadge;