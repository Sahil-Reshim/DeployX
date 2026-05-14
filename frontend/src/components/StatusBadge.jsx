function StatusBadge({ status }) {

  return (

    <div className={`status-badge ${status}`}>
      {status}
    </div>

  );
}

export default StatusBadge;