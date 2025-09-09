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
    created_at INTEGER
  )
`).run();

// Create a new task list
function createList({ id, userId, title, tasks }) {
  const stmt = db.prepare(`
    INSERT INTO task_lists (id, user_id, title, tasks, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, userId, title, JSON.stringify(tasks), Date.now());
}

// Search list by ID
function getList(id) {
  const row = db.prepare(`
    SELECT * FROM task_lists WHERE id = ?
  `).get(id);

  if (!row) return null;
  return {
    ...row,
    tasks: JSON.parse(row.tasks)
  };
}

// Update an existing list
function updateList({ id, title, tasks }) {
  const stmt = db.prepare(`
    UPDATE task_lists
    SET title = ?, tasks = ?
    WHERE id = ?
  `);
  stmt.run(title, JSON.stringify(tasks), id);
}

// Deletes a list by ID
function deleteList(id) {
  const stmt = db.prepare(`
    DELETE FROM task_lists WHERE id = ?
  `);
  stmt.run(id);
}

// Returns all lists for a user
function getUserLists(userId) {
  const rows = db.prepare(`
    SELECT * FROM task_lists WHERE user_id = ?
  `).all(userId);

  return rows.map(r => ({
    ...r,
    tasks: JSON.parse(r.tasks)
  }));
}

module.exports = {
  createList,
  getList,
  updateList,
  deleteList,
  getUserLists
};
