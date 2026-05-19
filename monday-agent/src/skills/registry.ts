import Anthropic from "@anthropic-ai/sdk";
import * as monday from "./monday/index.js";

// To add a new skill: import it and add an entry to the skills array.
// Each skill exports `tools` (Claude tool definitions) and `handleTool` (executor).
const skills: {
  tools: Anthropic.Tool[];
  handleTool: (name: string, input: Record<string, string>) => Promise<string>;
}[] = [monday];

export function getAllTools(): Anthropic.Tool[] {
  return skills.flatMap((s) => s.tools);
}

export async function dispatchTool(
  name: string,
  input: Record<string, string>
): Promise<string> {
  for (const skill of skills) {
    if (skill.tools.some((t) => t.name === name)) {
      return skill.handleTool(name, input);
    }
  }
  return `No skill found for tool: ${name}`;
}
