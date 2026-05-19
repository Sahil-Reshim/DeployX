function EmptyState() {

  return (

    <div className="empty-state">

      {/* BACKGROUND EFFECTS */}

      <div className="empty-state-grid"></div>

      <div className="empty-state-glow glow-1"></div>

      <div className="empty-state-glow glow-2"></div>

      {/* CONTENT */}

      <div className="empty-state-content">

        {/* ICON */}

        <div className="empty-state-icon-wrapper">

          <div className="empty-state-ring"></div>

          <div className="empty-state-ring ring-delay"></div>

          <span className="empty-state-icon">
            🚀
          </span>

        </div>

        {/* TEXT */}

        <div className="empty-state-text">

          <div className="empty-state-badge">

            DEPLOYX CLOUD

          </div>

          <h2>
            No Deployments Yet
          </h2>

          <p>

            Start your first deployment
            and monitor your entire CI/CD
            pipeline in real-time with
            DeployX runtime infrastructure.

          </p>

        </div>

        {/* FEATURES */}

        <div className="empty-state-features">

          <div className="empty-feature-card">

            <div className="feature-icon">

              ⚡

            </div>

            <div className="feature-content">

              <h4>
                Instant Deployments
              </h4>

              <p>
                Deploy directly from GitHub repositories.
              </p>

            </div>

          </div>

          <div className="empty-feature-card">

            <div className="feature-icon">

              🐳

            </div>

            <div className="feature-content">

              <h4>
                Docker Runtime
              </h4>

              <p>
                Automated container builds and execution.
              </p>

            </div>

          </div>

          <div className="empty-feature-card">

            <div className="feature-icon">

              📡

            </div>

            <div className="feature-content">

              <h4>
                Live Monitoring
              </h4>

              <p>
                Real-time logs and deployment tracking.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );
}

export default EmptyState;