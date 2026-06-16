// server/models/Task.js
//
// Thin wrapper around the tasks table — one function per operation we
// need: list, create, update, delete. All scoped by user_id so one
// user can never see or modify another user's tasks.

const db = require("../config/db");

const Task = {
  findAllByUser(userId) {
    return db
      .prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId);
  },

  findById(id, userId) {
    return db
      .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
      .get(id, userId);
  },

  create({ userId, title, description, priority, dueDate }) {
    const stmt = db.prepare(`
      INSERT INTO tasks (user_id, title, description, priority, due_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      userId,
      title,
      description || null,
      priority || "medium",
      dueDate || null
    );
    return Task.findById(result.lastInsertRowid, userId);
  },

  update(id, userId, fields) {
    const existing = Task.findById(id, userId);
    if (!existing) return null;

    const updated = { ...existing, ...fields };
    db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      updated.title,
      updated.description,
      updated.status,
      updated.priority,
      updated.due_date,
      id,
      userId
    );
    return Task.findById(id, userId);
  },

  remove(id, userId) {
    const result = db
      .prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
      .run(id, userId);
    return result.changes > 0;
  },
};

module.exports = Task;
