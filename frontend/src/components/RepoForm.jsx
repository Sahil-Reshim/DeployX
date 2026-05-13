import { useState } from "react";

function RepoForm() {

  const [repoUrl, setRepoUrl] = useState("");

  const handleDeploy = () => {

    console.log(repoUrl);

    alert("Deployment Started");

  };

  return (

    <div className="repo-form">

      <input
        type="text"
        placeholder="Enter GitHub Repository URL"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
      />

      <button onClick={handleDeploy}>
        Deploy
      </button>

    </div>
  );
}

export default RepoForm;