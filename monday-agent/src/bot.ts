import { Telegraf, Context } from "telegraf";
import { runAgent } from "./agent.js";
import { clearHistory } from "./memory.js";

export function createBot(token: string): Telegraf {
  const bot = new Telegraf(token);

  bot.start((ctx) => {
    ctx.reply(
      `👋 Hey! I'm your Monday.com agent.\n\nI can help you:\n• View and manage your boards\n• Create and update tasks\n• Find overdue items\n• Automate your workflow\n\nJust talk to me naturally. Try:\n  "Show me my boards"\n  "What's overdue?"\n  "Create a task called X in board Y"\n\nType /reset to clear our conversation history.`
    );
  });

  bot.command("reset", (ctx) => {
    clearHistory(String(ctx.from?.id));
    ctx.reply("Conversation cleared. Fresh start!");
  });

  bot.command("boards", async (ctx) => {
    await handleMessage(ctx, "List all my Monday.com boards");
  });

  bot.command("overdue", async (ctx) => {
    await handleMessage(ctx, "What tasks are overdue?");
  });

  bot.on("text", async (ctx) => {
    await handleMessage(ctx, ctx.message.text);
  });

  return bot;
}

async function handleMessage(ctx: Context, text: string) {
  const userId = String(ctx.from?.id ?? "unknown");
  // Show typing indicator
  await ctx.sendChatAction("typing");

  try {
    const reply = await runAgent(userId, text);
    await ctx.reply(reply, { parse_mode: "Markdown" });
  } catch (err) {
    const message = (err as Error).message;
    await ctx.reply(`Something went wrong: ${message}`);
  }
}
