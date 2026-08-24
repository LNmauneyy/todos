import type { SQLiteDatabase } from 'expo-sqlite';
import type { Tag, Todo, TodoRow } from '../types/todo';

// Runs once per DB connection (SQLiteProvider onInit). Safe to re-run:
// CREATE ... IF NOT EXISTS and a guarded ALTER TABLE keep old installs working.
export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      due_date TEXT
    );
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS todo_tags (
      todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (todo_id, tag_id)
    );
  `);

  // Older installs may already have a `todos` table without these columns.
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(todos);`);
  const columnNames = new Set(columns.map((c) => c.name));
  if (!columnNames.has('created_at')) {
    await db.execAsync(`ALTER TABLE todos ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));`);
  }
  if (!columnNames.has('due_date')) {
    await db.execAsync(`ALTER TABLE todos ADD COLUMN due_date TEXT;`);
  }
}

export async function fetchTodos(db: SQLiteDatabase): Promise<Todo[]> {
  const rows = await db.getAllAsync<TodoRow>(
    `SELECT id, title, completed, created_at, due_date FROM todos ORDER BY completed ASC, COALESCE(due_date, '9999-99-99') ASC, id DESC;`
  );
  const tagRows = await db.getAllAsync<{ todo_id: number; id: number; name: string; color: string }>(
    `SELECT tt.todo_id as todo_id, t.id as id, t.name as name, t.color as color
     FROM todo_tags tt JOIN tags t ON t.id = tt.tag_id;`
  );
  const tagsByTodo = new Map<number, Tag[]>();
  for (const row of tagRows) {
    const list = tagsByTodo.get(row.todo_id) ?? [];
    list.push({ id: row.id, name: row.name, color: row.color });
    tagsByTodo.set(row.todo_id, list);
  }
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: row.created_at,
    dueDate: row.due_date,
    tags: tagsByTodo.get(row.id) ?? [],
  }));
}

export async function fetchAllTags(db: SQLiteDatabase): Promise<Tag[]> {
  return db.getAllAsync<Tag>(`SELECT id, name, color FROM tags ORDER BY name ASC;`);
}

export async function createTodo(
  db: SQLiteDatabase,
  input: { title: string; dueDate: string | null; tags: { name: string; color: string }[] }
) {
  const result = await db.runAsync(
    `INSERT INTO todos (title, completed, due_date) VALUES (?, 0, ?);`,
    [input.title, input.dueDate]
  );
  const todoId = result.lastInsertRowId;
  for (const tag of input.tags) {
    await db.runAsync(
      `INSERT INTO tags (name, color) VALUES (?, ?) ON CONFLICT(name) DO NOTHING;`,
      [tag.name, tag.color]
    );
    await db.runAsync(
      `INSERT OR IGNORE INTO todo_tags (todo_id, tag_id)
       SELECT ?, id FROM tags WHERE name = ?;`,
      [todoId, tag.name]
    );
  }
  return todoId;
}

export async function toggleTodoCompleted(db: SQLiteDatabase, id: number, completed: number) {
  await db.runAsync(`UPDATE todos SET completed = ? WHERE id = ?;`, [completed, id]);
}

export async function deleteTodo(db: SQLiteDatabase, id: number) {
  await db.runAsync(`DELETE FROM todos WHERE id = ?;`, [id]);
}
