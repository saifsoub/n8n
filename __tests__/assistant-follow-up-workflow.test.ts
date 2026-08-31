import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = JSON.parse(
  readFileSync("n8n/workflows/assistant-control-hourly-follow-up.json", "utf8"),
);

const decisionNode = workflow.nodes.find(
  (node: { name: string }) => node.name === "Assign Owner and Decide",
);

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
    expect(controlUpdate.parameters.columns.matchingColumns).toEqual(["Task ID"]);
    expect(workflow.connections["Append Redacted Audit Evidence"].main[0][0].node).toBe("Link Evidence to Assistant Control");
  });
});
