import Anthropic from "@anthropic-ai/sdk";
import { getAllTools, dispatchTool } from "./skills/registry.js";
import { getHistory, appendMessage } from "./memory.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a Monday.com workspace agent. You help the user manage their boards, tasks, and workflows through natural conversation.

You have tools to:
- List and explore boards
- Read items and their statuses
- Create new items/tasks
- Update statuses and column values
- Move items between groups
- Find overdue items

Be concise and helpful. When the user asks about boards or tasks, always use your tools to get real data rather than guessing. Format responses cleanly using markdown.

If you need a board ID or item ID to complete an action, first call list_boards or get_board_items to find it — don't ask the user for IDs.`;

export async function runAgent(userId: string, userMessage: string): Promise<string> {
  const tools = getAllTools();

  appendMessage(userId, { role: "user", content: userMessage });

  const history = getHistory(userId);

  // Agentic loop: keep running until no more tool calls
  let response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools,
    messages: history,
  });

  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    // Add assistant's tool-calling message to history
    appendMessage(userId, { role: "assistant", content: response.content });

    // Execute all tool calls and collect results
    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (toolUse) => {
        let result: string;
        try {
          result = await dispatchTool(toolUse.name, toolUse.input as Record<string, string>);
        } catch (err) {
          result = `Error: ${(err as Error).message}`;
        }
        return {
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: result,
        };
      })
    );

    appendMessage(userId, { role: "user", content: toolResults });

    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools,
      messages: getHistory(userId),
    });
  }

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  const finalText = textBlock?.text ?? "Done.";

  appendMessage(userId, { role: "assistant", content: finalText });

  return finalText;
}
