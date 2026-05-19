import "dotenv/config";
import { createBot } from "./bot.js";

const { TELEGRAM_BOT_TOKEN, ANTHROPIC_API_KEY, MONDAY_API_TOKEN } = process.env;

if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is required in .env");
if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is required in .env");
if (!MONDAY_API_TOKEN) throw new Error("MONDAY_API_TOKEN is required in .env");

const bot = createBot(TELEGRAM_BOT_TOKEN);

bot.launch({ dropPendingUpdates: true });
console.log("Monday agent is running. Open Telegram and start chatting!");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
