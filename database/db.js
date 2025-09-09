const Database = require('better-sqlite3');
const path = require('path');

// creates/connects to .db file
const db = new Database(path.join(__dirname, 'tasklist.db'));

// create table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS task_lists (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    tasks TEXT, -- JSON string
    created_at INTEGER,
    updated_at INTEGER
  )
`).run();

// index to speed up queries per user
db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_user_id ON task_lists(user_id)
`).run();

// useful for secure JSON parsing
function safeParse(json, fallback = []) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// create a new list
function createList({ id, userId, title, tasks }) {
  const stmt = db.prepare(`
    INSERT INTO task_lists (id, user_id, title, tasks, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, userId, title, JSON.stringify(tasks), Date.now(), Date.now());
}

// search list by ID
function getList(id) {
  const row = db.prepare(`
    SELECT * FROM task_lists WHERE id = ?
  `).get(id);

  if (!row) return null;
  return {
    ...row,
    tasks: safeParse(row.tasks)
  };
}

// update existing list
function updateList({ id, title, tasks }) {
  const stmt = db.prepare(`
    UPDATE task_lists
    SET title = ?, tasks = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(title, JSON.stringify(tasks), Date.now(), id);
}

// delete list by ID
function deleteList(id) {
  const stmt = db.prepare(`
    DELETE FROM task_lists WHERE id = ?
  `);
  const result = stmt.run(id);
  return result.changes > 0; // true if actually deleted
}

// returns all lists for a user
function getUserLists(userId) {
  const rows = db.prepare(`
    SELECT * FROM task_lists WHERE user_id = ?
  `).all(userId);

  return rows.map(r => ({
    ...r,
    tasks: safeParse(r.tasks)
  }));
}

module.exports = {
  createList,
  getList,
  updateList,
  deleteList,
  getUserLists
};
