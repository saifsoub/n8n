import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = JSON.parse(
  readFileSync("workflows/assistant-control-hourly-follow-up.json", "utf8"),
);

const selectionNode = workflow.nodes.find(
  (node: { name: string }) => node.name === "Keep Active Rows",
);
const decisionNode = workflow.nodes.find(
  (node: { name: string }) => node.name === "Assign Owner and Decide",
);

function select(rows: Array<Record<string, unknown>>) {
  const evaluate = new Function("$input", "$execution", selectionNode.parameters.jsCode);
  return evaluate(
    { all: () => rows.map((json) => ({ json })) },
    { id: "test-run" },
  ).map((item: { json: Record<string, unknown> }) => item.json);
}

function decide(row: Record<string, unknown>) {
  const evaluate = new Function("$json", decisionNode.parameters.jsCode);
  return evaluate(row).json;
}

describe("Assistant Control hourly workflow", () => {
  it("has hourly and manual triggers feeding the live control tab", () => {
    const schedule = workflow.nodes.find((node: { name: string }) => node.name === "Every Hour");
    const read = workflow.nodes.find((node: { name: string }) => node.name === "Read Assistant Control");
    expect(schedule.parameters.rule.interval).toEqual([{ field: "hours", hoursInterval: 1 }]);
    expect(workflow.connections["Manual Evidence Run"]).toBeTruthy();
    expect(read.parameters.sheetName.value).toBe("Assistant Control");
  });

  it("selects a bounded priority-ordered batch", () => {
    const result = select([
      { row_number: 6, "Task ID": "p2", Status: "Active", Priority: "P2" },
      { row_number: 2, "Task ID": "p0-b", Status: "Active", Priority: "P0" },
      { row_number: 5, "Task ID": "p3", Status: "Active", Priority: "P3" },
      { row_number: 3, "Task ID": "p1-a", Status: "Active", Priority: "P1" },
      { row_number: 1, "Task ID": "p0-a", Status: "Active", Priority: "Urgent" },
      { row_number: 4, "Task ID": "p1-b", Status: "Active", Priority: "High" },
    ]);
    expect(result).toHaveLength(5);
    expect(result.map((row) => row["Task ID"])).toEqual([
      "p0-a",
      "p0-b",
      "p1-a",
      "p1-b",
      "p2",
    ]);
  });

  it("suppresses duplicate task IDs and recent in-flight execution across runs", () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60_000).toISOString();
    const oneSecondLater = new Date(now.getTime() + 1_000).toISOString();
    const result = select([
      { row_number: 1, "Task ID": "duplicate", Status: "Active", Priority: "P0" },
      { row_number: 2, "Task ID": "duplicate", Status: "Active", Priority: "P0" },
      {
        row_number: 3,
        "Task ID": "in-flight",
        Status: "Active",
        Priority: "P0",
        "Last Follow-up": oneMinuteAgo,
        "Follow-up Disposition": "execute",
      },
      {
        row_number: 4,
        "Task ID": "changed-after-dispatch",
        Status: "Active",
        Priority: "P0",
        "Last Follow-up": oneMinuteAgo,
        "Follow-up Disposition": "execute",
        "Updated At": oneSecondLater,
      },
    ]);
    expect(result.map((row) => row["Task ID"])).toEqual([
      "duplicate",
      "changed-after-dispatch",
    ]);
  });

  it("respects follow-up cooldowns when a row has not changed", () => {
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const result = select([
      {
        row_number: 1,
        "Task ID": "hourly-too-soon",
        Status: "Active",
        Priority: "P0",
        "Last Follow-up": oneMinuteAgo,
        "Follow-up Trigger": "Hourly",
        "Follow-up Disposition": "hold",
      },
      { row_number: 2, "Task ID": "fresh", Status: "Active", Priority: "P1" },
    ]);
    expect(result.map((row) => row["Task ID"])).toEqual(["fresh"]);
  });

  it("routes execution, escalation, archive, and silent outcomes", () => {
    const route = workflow.connections["Route Disposition"].main;
    expect(route.map((output: Array<{ node: string }>) => output[0].node)).toEqual([
      "Route to Worker",
      "Escalate Decision to Seif",
      "Archive Obsolete Definition",
      "Keep Working Silently",
    ]);
  });

  it("routes a clear authorized action to a worker and supplies a default owner", () => {
    const result = decide({
      "Task ID": "worker-example",
      Status: "Active",
      "Has Value": "yes",
      "Next Action": "Prepare the redacted report",
      Authorized: "yes",
    });
    expect(result["Execution Owner"]).toBe("S/PM Orchestration");
    expect(result._followUp.disposition).toBe("execute");
  });

  it("configures the worker route authorization header as a bearer token expression", () => {
    const worker = workflow.nodes.find((node: { name: string }) => node.name === "Route to Worker");
    expect(worker.parameters.headerParameters.parameters).toEqual([
      {
        name: "Authorization",
        value: "={{ 'Bearer ' + $env.ASSISTANT_WORKER_ROUTER_TOKEN }}",
      },
    ]);
  });

  it("recognizes annotated yes values used by the live sheet", () => {
    const result = decide({
      "Task ID": "annotated-owner-gate",
      Status: "Active",
      "Has Value": "yes",
      "Next Action": "Publish externally",
      Authorized: "yes",
      "Owner Judgment": "yes — owner gates only",
    });
    expect(result._followUp.disposition).toBe("escalate");
    expect(result._followUp.reason).toBe("Final owner-only judgment or submission required.");
  });

  it("keeps ordinary ambiguity silent instead of escalating", () => {
    const result = decide({
      "Task ID": "no-escalation-example",
      Status: "Pending",
      "Has Value": "yes",
      Authorized: "no",
    });
    expect(result._followUp.disposition).toBe("hold");
    expect(result._followUp.reason).toContain("silently");
  });

  it("contains an explicit decision-escalation example", () => {
    const result = decide({
      "Task ID": "decision-escalation-example",
      Status: "Blocked",
      "Has Value": "yes",
      "Next Action": "Choose launch region",
      "Outcome Decision Required": "yes",
    });
    expect(result._followUp.disposition).toBe("escalate");
    expect(result._followUp.reason).toBe("Outcome-changing decision required.");
  });

  it("skips rows that cannot be linked back to a sheet row", () => {
    const result = select([{ "Task ID": "no-row-number", Status: "Active", Priority: "P0" }]);
    expect(result).toEqual([]);
  });

  it("archives obsolete work rather than leaving it ownerless", () => {
    const result = decide({ "Task ID": "archive-example", Status: "Obsolete" });
    expect(result._followUp.disposition).toBe("archive");
    expect(result["Execution Owner"]).toBe("");
  });

  it("retains executions and appends redacted evidence", () => {
    expect(workflow.settings.saveDataSuccessExecution).toBe("all");
    expect(workflow.settings.saveDataErrorExecution).toBe("all");
    const audit = workflow.nodes.find((node: { name: string }) => node.name === "Append Redacted Audit Evidence");
    expect(audit.parameters.sheetName.value).toBe("Assistant Activity");
    expect(Object.keys(audit.parameters.columns.value)).toEqual([
      "Run ID", "Task ID", "Timestamp", "Disposition", "Execution Owner", "Reason", "Outcome", "Evidence URL",
    ]);
    const controlUpdate = workflow.nodes.find((node: { name: string }) => node.name === "Link Evidence to Assistant Control");
    expect(controlUpdate.parameters.operation).toBe("update");
    expect(controlUpdate.parameters.columns.matchingColumns).toEqual(["row_number"]);
    expect(workflow.connections["Append Redacted Audit Evidence"].main[0][0].node).toBe("Link Evidence to Assistant Control");
  });
});
