const MONDAY_API_URL = "https://api.monday.com/v2";

async function query(gql: string, variables: Record<string, unknown> = {}): Promise<unknown> {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) throw new Error("MONDAY_API_TOKEN not set");

  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      "API-Version": "2024-01",
    },
    body: JSON.stringify({ query: gql, variables }),
  });

  const json = (await res.json()) as { data?: unknown; errors?: unknown[] };
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

export async function listBoards() {
  const data = (await query(`
    query { boards(limit: 50) { id name description state } }
  `)) as { boards: { id: string; name: string; description: string; state: string }[] };
  return data.boards;
}

export async function getBoardItems(boardId: string) {
  const data = (await query(
    `query($boardId: [ID!]) {
      boards(ids: $boardId) {
        name
        groups { id title }
        items_page(limit: 100) {
          items {
            id name
            group { id title }
            column_values { id text column { title } }
            created_at
            updated_at
          }
        }
      }
    }`,
    { boardId: [boardId] }
  )) as {
    boards: {
      name: string;
      groups: { id: string; title: string }[];
      items_page: {
        items: {
          id: string;
          name: string;
          group: { id: string; title: string };
          column_values: { id: string; text: string; column: { title: string } }[];
          created_at: string;
          updated_at: string;
        }[];
      };
    }[];
  };
  return data.boards[0];
}

export async function createItem(
  boardId: string,
  groupId: string,
  itemName: string,
  columnValues?: Record<string, string>
) {
  const data = (await query(
    `mutation($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON) {
      create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $columnValues) {
        id name
      }
    }`,
    {
      boardId,
      groupId,
      itemName,
      columnValues: columnValues ? JSON.stringify(columnValues) : undefined,
    }
  )) as { create_item: { id: string; name: string } };
  return data.create_item;
}

export async function updateColumnValue(
  boardId: string,
  itemId: string,
  columnId: string,
  value: string
) {
  const data = (await query(
    `mutation($boardId: ID!, $itemId: ID!, $columnId: String!, $value: String!) {
      change_simple_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
        id name
      }
    }`,
    { boardId, itemId, columnId, value }
  )) as { change_simple_column_value: { id: string; name: string } };
  return data.change_simple_column_value;
}

export async function moveItemToGroup(itemId: string, groupId: string) {
  const data = (await query(
    `mutation($itemId: ID!, $groupId: String!) {
      move_item_to_group(item_id: $itemId, group_id: $groupId) { id }
    }`,
    { itemId, groupId }
  )) as { move_item_to_group: { id: string } };
  return data.move_item_to_group;
}

export async function getOverdueItems() {
  const boards = await listBoards();
  const overdue: {
    board: string;
    item: string;
    group: string;
    dueDate: string;
  }[] = [];

  const now = new Date();

  for (const board of boards.slice(0, 10)) {
    const details = await getBoardItems(board.id);
    if (!details) continue;
    for (const item of details.items_page.items) {
      const dueDateCol = item.column_values.find(
        (cv) => cv.column.title.toLowerCase().includes("due") || cv.id === "due_date"
      );
      if (dueDateCol?.text) {
        const due = new Date(dueDateCol.text);
        if (!isNaN(due.getTime()) && due < now) {
          overdue.push({
            board: board.name,
            item: item.name,
            group: item.group?.title ?? "",
            dueDate: dueDateCol.text,
          });
        }
      }
    }
  }

  return overdue;
}
