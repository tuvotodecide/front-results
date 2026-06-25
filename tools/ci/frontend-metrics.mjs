import { appendFileSync, writeFileSync } from "node:fs";

const OUTPUT_FILE = "frontend-admin-metrics.json";
const DEFAULT_WINDOW_DAYS = 30;
const MAX_FAILED_RUNS_FOR_CAUSES = 20;

const env = process.env;
const now = new Date();
const windowDays = Number(env.FRONTEND_METRICS_WINDOW_DAYS || DEFAULT_WINDOW_DAYS);
const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

const token = env.GITHUB_TOKEN;
const repository = env.GITHUB_REPOSITORY || "unknown";
const runId = env.GITHUB_RUN_ID;
const branch = env.GITHUB_REF_NAME || "unknown";
const eventName = env.GITHUB_EVENT_NAME || "local";
const sha = env.GITHUB_SHA || "unknown";
const summaryPath = env.GITHUB_STEP_SUMMARY;

const warnings = [];

const secondsBetween = (start, end) => {
  if (!start || !end) return null;
  const value = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
};

const minutes = (seconds) => (seconds === null ? null : Number((seconds / 60).toFixed(2)));

const average = (values) => {
  const valid = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
};

const min = (values) => {
  const valid = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  return valid.length === 0 ? null : Math.min(...valid);
};

const max = (values) => {
  const valid = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  return valid.length === 0 ? null : Math.max(...valid);
};

const iso = (date) => (date instanceof Date ? date.toISOString() : null);

const classifyBlockingCause = (name = "") => {
  const normalized = String(name).toLowerCase();
  if (normalized.includes("lint")) return "lint";
  if (normalized.includes("typecheck") || normalized.includes("type check") || normalized.includes("tsc")) {
    return "typecheck";
  }
  if (normalized.includes("unit")) return "unit tests";
  if (normalized.includes("integration")) return "integration tests";
  if (normalized.includes("coverage")) return "coverage";
  if (normalized.includes("dependency") || normalized.includes("dependencies")) return "check:dependencies";
  if (normalized.includes("docker") || normalized.includes("build & push") || normalized.includes("buildx")) {
    return "docker build/push";
  }
  if (normalized.includes("deploy") || normalized.includes("hetzner") || normalized.includes("ssh")) return "deploy";
  if (normalized.includes("build")) return "build";
  return "unknown";
};

const emptyMetrics = (mode = "unavailable") => ({
  generatedAt: now.toISOString(),
  repository,
  branch,
  eventName,
  runId: runId || null,
  sha,
  windowDays,
  windowStart: windowStart.toISOString(),
  mode,
  integrationTime: {
    status: "sin datos suficientes",
    currentRunDurationSeconds: null,
    currentRunDurationMinutes: null,
    jobs: [],
  },
  integrationFrequency: {
    status: "sin datos suficientes",
    successfulMainIntegrations: 0,
    averagePerWeek: 0,
    averagePerDay: 0,
  },
  prMergeTime: {
    status: "sin datos suficientes",
    pullRequestsConsidered: 0,
    averageSeconds: null,
    averageMinutes: null,
    minSeconds: null,
    maxSeconds: null,
  },
  failureRateAfterChanges: {
    status: "sin datos suficientes",
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    failureRate: 0,
    failuresPerIntegration: 0,
  },
  recoveryTime: {
    status: "sin datos suficientes",
    incidentsConsidered: 0,
    averageSeconds: null,
    averageMinutes: null,
    lastRecoverySeconds: null,
    lastRecoveryMinutes: null,
  },
  blockingCauses: [],
  warnings,
});

const writeOutputs = (metrics) => {
  writeFileSync(OUTPUT_FILE, `${JSON.stringify(metrics, null, 2)}\n`);

  const summary = [
    "# Frontend admin measurable pipeline parameters",
    "",
    `Generated at: ${metrics.generatedAt}`,
    `Repository: ${metrics.repository}`,
    `Branch: ${metrics.branch}`,
    `Window: ${metrics.windowDays} days`,
    `Mode: ${metrics.mode}`,
    "",
    "## Metrics",
    "",
    "| Parameter | Result |",
    "|---|---:|",
    `| Integration time | ${metrics.integrationTime.currentRunDurationMinutes ?? "sin datos suficientes"} min |`,
    `| Main integrations | ${metrics.integrationFrequency.successfulMainIntegrations} |`,
    `| Integrations per week | ${metrics.integrationFrequency.averagePerWeek} |`,
    `| PRs considered | ${metrics.prMergeTime.pullRequestsConsidered} |`,
    `| Average PR to merge | ${metrics.prMergeTime.averageMinutes ?? "sin datos suficientes"} min |`,
    `| Failure rate | ${metrics.failureRateAfterChanges.failureRate}% |`,
    `| Failures per integration | ${metrics.failureRateAfterChanges.failuresPerIntegration} |`,
    `| Recovery incidents | ${metrics.recoveryTime.incidentsConsidered} |`,
    `| Average recovery time | ${metrics.recoveryTime.averageMinutes ?? "sin datos suficientes"} min |`,
    "",
    "## Blocking causes",
    "",
    "| Cause | Count |",
    "|---|---:|",
    ...(metrics.blockingCauses.length > 0
      ? metrics.blockingCauses.map((cause) => `| ${cause.cause} | ${cause.count} |`)
      : ["| sin datos suficientes | 0 |"]),
    "",
  ];

  if (metrics.warnings.length > 0) {
    summary.push("## Warnings", "", ...metrics.warnings.map((warning) => `- ${warning}`), "");
  }

  const summaryText = `${summary.join("\n")}\n`;
  if (summaryPath) {
    appendFileSync(summaryPath, summaryText);
  } else {
    console.log(summaryText);
  }

  console.log(`Wrote ${OUTPUT_FILE}`);
};

const api = async (path, params = {}) => {
  const url = new URL(`https://api.github.com${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "frontend-admin-metrics",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status} for ${url.pathname}: ${body.slice(0, 240)}`);
  }

  return response.json();
};

const getAllPages = async (path, params = {}, maxPages = 5) => {
  const items = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const data = await api(path, { per_page: 100, ...params, page });
    const pageItems = Array.isArray(data) ? data : data.workflow_runs || data.jobs || data.items || [];
    items.push(...pageItems);
    if (pageItems.length < 100) break;
  }
  return items;
};

const getRuns = async (workflowId) => {
  const path = workflowId
    ? `/repos/${repository}/actions/workflows/${workflowId}/runs`
    : `/repos/${repository}/actions/runs`;
  return getAllPages(path, {
    created: `>=${windowStart.toISOString()}`,
    exclude_pull_requests: false,
  });
};

const getRunJobs = async (id) => {
  if (!id) return [];
  return getAllPages(`/repos/${repository}/actions/runs/${id}/jobs`, {}, 3);
};

const getMergedPullRequests = async () => {
  const pulls = await getAllPages(`/repos/${repository}/pulls`, {
    state: "closed",
    base: "main",
    sort: "updated",
    direction: "desc",
  });

  return pulls.filter((pull) => pull.merged_at && new Date(pull.merged_at) >= windowStart);
};

const buildIntegrationTime = (currentRun, currentJobs) => {
  const durationSeconds = secondsBetween(currentRun?.created_at, currentRun?.updated_at);
  const jobs = currentJobs
    .filter((job) => ["Quality checks", "Build & Push Docker image", "Deploy to Hetzner (dev) via SSH", "Deploy to Hetzner (prod) via SSH", "Frontend metrics"].includes(job.name))
    .map((job) => {
      const jobSeconds = secondsBetween(job.started_at, job.completed_at);
      return {
        name: job.name,
        status: job.status,
        conclusion: job.conclusion,
        durationSeconds: jobSeconds,
        durationMinutes: minutes(jobSeconds),
      };
    });

  return {
    status: durationSeconds === null ? "sin datos suficientes" : "ok",
    createdAt: currentRun?.created_at || null,
    updatedAt: currentRun?.updated_at || null,
    currentRunDurationSeconds: durationSeconds,
    currentRunDurationMinutes: minutes(durationSeconds),
    jobs,
  };
};

const buildIntegrationFrequency = (runs) => {
  const integrations = runs.filter(
    (run) =>
      run.event === "push" &&
      run.head_branch === "main" &&
      run.status === "completed" &&
      run.conclusion === "success" &&
      new Date(run.created_at) >= windowStart,
  );

  const total = integrations.length;
  return {
    status: total > 0 ? "ok" : "sin datos suficientes",
    successfulMainIntegrations: total,
    averagePerWeek: Number((total / (windowDays / 7)).toFixed(2)),
    averagePerDay: Number((total / windowDays).toFixed(2)),
  };
};

const buildPrMergeTime = (pulls) => {
  const durations = pulls.map((pull) => secondsBetween(pull.created_at, pull.merged_at));
  const avg = average(durations);
  return {
    status: pulls.length > 0 ? "ok" : "sin datos suficientes",
    pullRequestsConsidered: pulls.length,
    averageSeconds: avg,
    averageMinutes: minutes(avg),
    minSeconds: min(durations),
    maxSeconds: max(durations),
  };
};

const buildFailureRate = (runs, successfulMainIntegrations) => {
  const completed = runs.filter((run) => run.status === "completed" && new Date(run.created_at) >= windowStart);
  const successful = completed.filter((run) => run.conclusion === "success").length;
  const failed = completed.filter((run) => ["failure", "timed_out", "cancelled", "action_required"].includes(run.conclusion)).length;
  const total = completed.length;

  return {
    status: total > 0 ? "ok" : "sin datos suficientes",
    totalRuns: total,
    successfulRuns: successful,
    failedRuns: failed,
    failureRate: total > 0 ? Number(((failed / total) * 100).toFixed(2)) : 0,
    failuresPerIntegration:
      successfulMainIntegrations > 0 ? Number((failed / successfulMainIntegrations).toFixed(2)) : 0,
  };
};

const buildRecoveryTime = (runs) => {
  const completed = runs
    .filter((run) => run.status === "completed")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const recoveries = [];
  for (let index = 0; index < completed.length; index += 1) {
    const run = completed[index];
    if (!["failure", "timed_out", "cancelled", "action_required"].includes(run.conclusion)) continue;

    const recoveredBy = completed.slice(index + 1).find((candidate) => candidate.conclusion === "success");
    if (!recoveredBy) continue;

    const recoverySeconds = secondsBetween(run.updated_at || run.created_at, recoveredBy.updated_at || recoveredBy.created_at);
    if (recoverySeconds !== null) {
      recoveries.push(recoverySeconds);
    }
  }

  const avg = average(recoveries);
  const last = recoveries.length > 0 ? recoveries[recoveries.length - 1] : null;
  return {
    status: recoveries.length > 0 ? "ok" : "sin datos suficientes",
    incidentsConsidered: recoveries.length,
    averageSeconds: avg,
    averageMinutes: minutes(avg),
    lastRecoverySeconds: last,
    lastRecoveryMinutes: minutes(last),
  };
};

const buildBlockingCauses = async (runs, currentJobs) => {
  const failedRuns = runs
    .filter((run) => run.status === "completed" && ["failure", "timed_out", "cancelled", "action_required"].includes(run.conclusion))
    .slice(0, MAX_FAILED_RUNS_FOR_CAUSES);

  const causeCounts = new Map();
  const addCause = (cause) => causeCounts.set(cause, (causeCounts.get(cause) || 0) + 1);

  const collectFromJobs = (jobs) => {
    jobs.forEach((job) => {
      if (!["failure", "timed_out", "cancelled", "action_required"].includes(job.conclusion)) return;
      const failedStep = (job.steps || []).find((step) =>
        ["failure", "timed_out", "cancelled", "action_required"].includes(step.conclusion),
      );
      addCause(classifyBlockingCause(failedStep?.name || job.name));
    });
  };

  collectFromJobs(currentJobs);

  for (const run of failedRuns) {
    try {
      collectFromJobs(await getRunJobs(run.id));
    } catch (error) {
      warnings.push(`No se pudieron leer jobs del run ${run.id}: ${error.message}`);
    }
  }

  return [...causeCounts.entries()]
    .map(([cause, count]) => ({ cause, count }))
    .sort((a, b) => b.count - a.count || a.cause.localeCompare(b.cause));
};

const main = async () => {
  if (!token || repository === "unknown") {
    warnings.push("GITHUB_TOKEN o GITHUB_REPOSITORY no disponible; se genero reporte local limitado.");
    writeOutputs(emptyMetrics("local-limited"));
    return;
  }

  try {
    const currentRun = runId ? await api(`/repos/${repository}/actions/runs/${runId}`) : null;
    const workflowId = currentRun?.workflow_id;
    const [runs, currentJobs, mergedPulls] = await Promise.all([
      getRuns(workflowId),
      getRunJobs(runId),
      getMergedPullRequests(),
    ]);

    const integrationFrequency = buildIntegrationFrequency(runs);
    const metrics = {
      ...emptyMetrics("github-actions"),
      workflowId: workflowId || null,
      integrationTime: buildIntegrationTime(currentRun, currentJobs),
      integrationFrequency,
      prMergeTime: buildPrMergeTime(mergedPulls),
      failureRateAfterChanges: buildFailureRate(
        runs,
        integrationFrequency.successfulMainIntegrations,
      ),
      recoveryTime: buildRecoveryTime(runs),
      blockingCauses: await buildBlockingCauses(runs, currentJobs),
      warnings,
    };

    writeOutputs(metrics);
  } catch (error) {
    warnings.push(`No se pudieron calcular metricas con GitHub API: ${error.message}`);
    writeOutputs(emptyMetrics("github-api-error"));
  }
};

await main();
