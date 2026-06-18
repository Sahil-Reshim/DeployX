/**
 * Merge Jenkins / deployment fields without losing live socket data
 * when REST polling returns stale or partial payloads.
 */

export function hasJenkinsStages(stages) {
  return Array.isArray(stages) && stages.length > 0;
}

export function mergeDeploymentRecord(prev, next) {
  if (!next) {
    return null;
  }

  if (!prev || Number(prev.id) !== Number(next.id)) {
    return {
      ...next,
      jenkins_stages: next.jenkins_stages || [],
    };
  }

  return {
    ...next,
    jenkins_status:
      next.jenkins_status ?? prev.jenkins_status,
    jenkins_build_number:
      next.jenkins_build_number ?? prev.jenkins_build_number,
    current_step:
      next.current_step ?? prev.current_step,
    jenkins_stages: hasJenkinsStages(next.jenkins_stages)
      ? next.jenkins_stages
      : prev.jenkins_stages || next.jenkins_stages || [],
  };
}

export function mergeSocketUpdate(prev, incoming) {
  if (!incoming) {
    return prev;
  }

  if (
    prev &&
    incoming.deployment_id != null &&
    prev.id != null &&
    Number(prev.id) !== Number(incoming.deployment_id)
  ) {
    return prev;
  }

  const base = prev || {
    id: incoming.deployment_id ?? incoming.id,
  };

  const isMetricsOnly =
    incoming.metrics != null &&
    incoming.jenkins_status == null &&
    incoming.jenkins_build_number == null &&
    incoming.url == null &&
    incoming.container_id == null &&
    incoming.current_step == null &&
    !hasJenkinsStages(incoming.jenkins_stages);

  return {
    ...base,
    ...incoming,
    id:
      base.id ??
      incoming.id ??
      incoming.deployment_id,
    status: isMetricsOnly
      ? (base.status ?? incoming.status)
      : (incoming.status ?? base.status),
    url: incoming.url ?? base.url,
    logs: incoming.logs ?? base.logs,
    metrics: incoming.metrics ?? base.metrics,
    container_id:
      incoming.container_id ?? base.container_id,
    jenkins_status:
      incoming.jenkins_status ?? base.jenkins_status,
    jenkins_build_number:
      incoming.jenkins_build_number ??
      base.jenkins_build_number,
    current_step:
      incoming.current_step !== undefined
        ? incoming.current_step
        : base.current_step,
    jenkins_stages: hasJenkinsStages(incoming.jenkins_stages)
      ? incoming.jenkins_stages
      : base.jenkins_stages || [],
  };
}

export function buildJenkinsView(deployment) {
  if (!deployment) {
    return null;
  }

  return {
    build_number: deployment.jenkins_build_number,
    status: deployment.jenkins_status,
    current_stage: deployment.current_step,
    stages: deployment.jenkins_stages || [],
  };
}

export function formatJenkinsStageName(stage) {
  if (!stage || stage === "Waiting...") {
    return "Waiting...";
  }

  return stage
    .split("_")
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1) : word
    )
    .join(" ");
}

export function stageSlug(name) {
  return (name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}
