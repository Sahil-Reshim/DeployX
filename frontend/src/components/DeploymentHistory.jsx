import DeploymentItem from "./DeploymentItem";
import EmptyState from "./EmptyState";

function DeploymentHistory({ deployments }) {

  return (

    <div className="history-section">

      <div className="section-header">

        <h1>
          Live Deployments
        </h1>

        <span>
          {deployments.length} Running
        </span>

      </div>

      {

        deployments.length === 0

        ?

        <EmptyState />

        :

        deployments.map((deployment) => (

          <DeploymentItem
            key={deployment.id}
            deployment={deployment}
          />

        ))

      }

    </div>
  );
}

export default DeploymentHistory;