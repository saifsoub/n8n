import Anthropic from "@anthropic-ai/sdk";

// Per-user conversation history stored in memory.
// Replace this Map with Redis or a DB for persistence across restarts.
const histories = new Map<string, Anthropic.MessageParam[]>();

export function getHistory(userId: string): Anthropic.MessageParam[] {
  if (!histories.has(userId)) histories.set(userId, []);
  return histories.get(userId)!;
}

export function appendMessage(userId: string, message: Anthropic.MessageParam) {
  getHistory(userId).push(message);
  // Keep last 40 messages to avoid token limits
  const history = histories.get(userId)!;
  if (history.length > 40) history.splice(0, history.length - 40);
}

export function clearHistory(userId: string) {
  histories.set(userId, []);
}
