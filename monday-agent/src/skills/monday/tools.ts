import Anthropic from "@anthropic-ai/sdk";
import * as api from "./api.js";

export const tools: Anthropic.Tool[] = [
  {
    name: "list_boards",
    description: "List all Monday.com boards the user has access to.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_board_items",
    description:
      "Get all items/tasks in a specific Monday.com board, including their status, assignee, and other column values.",
    input_schema: {
      type: "object",
      properties: {
        board_id: { type: "string", description: "The ID of the board" },
      },
      required: ["board_id"],
    },
  },
  {
    name: "create_item",
    description: "Create a new item/task in a Monday.com board.",
    input_schema: {
      type: "object",
      properties: {
        board_id: { type: "string", description: "The ID of the board" },
        group_id: {
          type: "string",
          description:
            "The ID of the group/section within the board. Use list_boards or get_board_items to find group IDs.",
        },
        item_name: { type: "string", description: "The name of the new item/task" },
      },
      required: ["board_id", "group_id", "item_name"],
    },
  },
  {
    name: "update_item_status",
    description: "Update any column value (status, text, date, etc.) of an item in Monday.com.",
    input_schema: {
      type: "object",
      properties: {
        board_id: { type: "string", description: "The ID of the board" },
        item_id: { type: "string", description: "The ID of the item to update" },
        column_id: {
          type: "string",
          description: "The column ID to update (e.g. 'status', 'date', 'text')",
        },
        value: { type: "string", description: "The new value to set" },
      },
      required: ["board_id", "item_id", "column_id", "value"],
    },
  },
  {
    name: "move_item_to_group",
    description: "Move an item to a different group/section within a board.",
    input_schema: {
      type: "object",
      properties: {
        item_id: { type: "string", description: "The ID of the item to move" },
        group_id: {
          type: "string",
          description: "The ID of the destination group",
        },
      },
      required: ["item_id", "group_id"],
    },
  },
  {
    name: "get_overdue_items",
    description:
      "Find all overdue items across all boards (items where the due date has passed).",
    input_schema: { type: "object", properties: {}, required: [] },
  },
];

export async function handleTool(name: string, input: Record<string, string>): Promise<string> {
  switch (name) {
    case "list_boards": {
      const boards = await api.listBoards();
      if (!boards.length) return "No boards found.";
      return boards.map((b) => `• [${b.id}] **${b.name}**`).join("\n");
    }

    case "get_board_items": {
      const board = await api.getBoardItems(input.board_id);
      if (!board) return "Board not found.";
      const lines = [`**${board.name}**\n`];
      for (const group of board.groups) {
        const items = board.items_page.items.filter((i) => i.group?.id === group.id);
        if (!items.length) continue;
        lines.push(`\n📁 ${group.title}`);
        for (const item of items) {
          const cols = item.column_values
            .filter((cv) => cv.text)
            .map((cv) => `${cv.column.title}: ${cv.text}`)
            .join(" | ");
          lines.push(`  • [${item.id}] ${item.name}${cols ? ` — ${cols}` : ""}`);
        }
      }
      return lines.join("\n");
    }

    case "create_item": {
      const item = await api.createItem(input.board_id, input.group_id, input.item_name);
      return `Created item **${item.name}** (ID: ${item.id})`;
    }

    case "update_item_status": {
      const item = await api.updateColumnValue(
        input.board_id,
        input.item_id,
        input.column_id,
        input.value
      );
      return `Updated **${item.name}** — column \`${input.column_id}\` set to "${input.value}"`;
    }

    case "move_item_to_group": {
      await api.moveItemToGroup(input.item_id, input.group_id);
      return `Moved item ${input.item_id} to group ${input.group_id}`;
    }

    case "get_overdue_items": {
      const items = await api.getOverdueItems();
      if (!items.length) return "No overdue items found.";
      return items
        .map((i) => `• **${i.item}** (${i.board} › ${i.group}) — due ${i.dueDate}`)
        .join("\n");
    }

    default:
      return `Unknown tool: ${name}`;
  }
}
