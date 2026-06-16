// server/routes/tasks.js
const express = require("express");
const Task = require("../models/Task");
const { broadcastToUser } = require("../ws");

const router = express.Router();

const VALID_STATUSES = ["todo", "in_progress", "done"];
const VALID_PRIORITIES = ["low", "medium", "high"];

// GET /api/tasks — list all tasks belonging to the logged-in user
router.get("/", (req, res) => {
  const tasks = Task.findAllByUser(req.userId);
  res.json(tasks);
});

// POST /api/tasks — create a new task
router.post("/", (req, res) => {
  const { title, description, priority, dueDate } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: "Priority must be low, medium, or high" });
  }

  const task = Task.create({
    userId: req.userId,
    title: title.trim(),
    description,
    priority,
    dueDate,
  });

  broadcastToUser(req.userId, { type: "task_created", task });
  res.status(201).json(task);
});

// PUT /api/tasks/:id — update a task
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = Task.findById(id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: "Task not found" });
  }

  const { title, description, status, priority, dueDate } = req.body;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Status must be todo, in_progress, or done" });
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: "Priority must be low, medium, or high" });
  }

  const updated = Task.update(id, req.userId, {
    title: title !== undefined ? title.trim() : existing.title,
    description: description !== undefined ? description : existing.description,
    status: status || existing.status,
    priority: priority || existing.priority,
    due_date: dueDate !== undefined ? dueDate : existing.due_date,
  });

  broadcastToUser(req.userId, { type: "task_updated", task: updated });
  res.json(updated);
});

// DELETE /api/tasks/:id — delete a task
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const deleted = Task.remove(id, req.userId);
  if (!deleted) {
    return res.status(404).json({ error: "Task not found" });
  }

  broadcastToUser(req.userId, { type: "task_deleted", taskId: id });
  res.status(204).send();
});

module.exports = router;