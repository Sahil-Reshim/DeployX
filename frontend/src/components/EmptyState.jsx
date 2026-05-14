function EmptyState({ onDeploy }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">🚀</span>
      <h2>No Deployments Yet</h2>
      <p>Deploy your first GitHub repository to get started.</p>
      {onDeploy && (
        <button className="btn btn-primary" onClick={onDeploy}>
          Deploy Your First App
        </button>
      )}
    </div>
  );
}

export default EmptyState;