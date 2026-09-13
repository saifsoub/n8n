import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const workflow = JSON.parse(readFileSync('workflows/assistant-control-hourly-follow-up.json', 'utf8'));
const selectionNode = workflow.nodes.find((node) => node.name === 'Keep Active Rows');
const decisionNode = workflow.nodes.find((node) => node.name === 'Assign Owner and Decide');
assert(selectionNode, 'Keep Active Rows node missing');
assert(decisionNode, 'Assign Owner and Decide node missing');

function select(rows) {
  const evaluate = new Function('$input', '$execution', selectionNode.parameters.jsCode);
  return evaluate({ all: () => rows.map((json) => ({ json })) }, { id: 'validation-run' }).map((item) => item.json);
}

function decide(row) {
  const evaluate = new Function('$json', decisionNode.parameters.jsCode);
  return evaluate(row).json;
}

const priorityRows = select([
  { row_number: 6, 'Task ID': 'p2', Status: 'Active', Priority: 'P2' },
  { row_number: 2, 'Task ID': 'p0-b', Status: 'Active', Priority: 'P0' },
  { row_number: 5, 'Task ID': 'p3', Status: 'Active', Priority: 'P3' },
  { row_number: 3, 'Task ID': 'p1-a', Status: 'Active', Priority: 'P1' },
  { row_number: 1, 'Task ID': 'p0-a', Status: 'Active', Priority: 'Urgent' },
  { row_number: 4, 'Task ID': 'p1-b', Status: 'Active', Priority: 'High' },
]);
assert.deepEqual(priorityRows.map((row) => row['Task ID']), ['p0-a', 'p0-b', 'p1-a', 'p1-b', 'p2']);

const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
const oneSecondLater = new Date(Date.now() + 1_000).toISOString();
const suppressed = select([
  { row_number: 1, 'Task ID': 'duplicate', Status: 'Active', Priority: 'P0' },
  { row_number: 2, 'Task ID': 'duplicate', Status: 'Active', Priority: 'P0' },
  { row_number: 3, 'Task ID': 'in-flight', Status: 'Active', Priority: 'P0', 'Last Follow-up': oneMinuteAgo, 'Follow-up Disposition': 'execute' },
  { row_number: 4, 'Task ID': 'changed-after-dispatch', Status: 'Active', Priority: 'P0', 'Last Follow-up': oneMinuteAgo, 'Follow-up Disposition': 'execute', 'Updated At': oneSecondLater },
]);
assert.deepEqual(suppressed.map((row) => row['Task ID']), ['duplicate', 'changed-after-dispatch']);
assert.deepEqual(select([{ 'Task ID': 'missing-row', Status: 'Active', Priority: 'P0' }]), []);

const annotatedGate = decide({
  'Task ID': 'annotated-owner-gate',
  Status: 'Active',
  'Has Value': 'yes',
  Authorized: 'yes',
  'Next Action': 'Publish externally',
  'Owner Judgment': 'yes — owner gates only',
});
assert.equal(annotatedGate._followUp.disposition, 'escalate');

const execute = decide({ 'Task ID': 'execute', Status: 'Active', 'Has Value': 'yes', Authorized: 'yes', 'Next Action': 'Do reversible work' });
assert.equal(execute._followUp.disposition, 'execute');
const hold = decide({ 'Task ID': 'hold', Status: 'Pending', 'Has Value': 'yes', Authorized: 'no' });
assert.equal(hold._followUp.disposition, 'hold');
const archive = decide({ 'Task ID': 'archive', Status: 'Obsolete' });
assert.equal(archive._followUp.disposition, 'archive');

assert.equal(workflow.active, false, 'workflow must remain inactive in source control until governed credential binding/live acceptance');
console.log('Assistant follow-up safety validation: PASS');
