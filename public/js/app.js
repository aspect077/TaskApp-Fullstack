// public/js/app.js
// All frontend logic: auth, tasks, WebSocket live updates

const API = "";         // same origin — Express serves this file
let token = null;       // JWT stored in memory (never localStorage for security)
let currentFilter = "all";
let editingTaskId = null;
let ws = null;

// ── UTILS ──────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

// ── AUTH ───────────────────────────────────────────────────────────────

function showTab(tab) {
  document.getElementById("form-login").style.display = tab === "login" ? "" : "none";
  document.getElementById("form-signup").style.display = tab === "signup" ? "" : "none";
  document.getElementById("tab-login").classList.toggle("active", tab === "login");
  document.getElementById("tab-signup").classList.toggle("active", tab === "signup");
  document.getElementById("login-error").textContent = "";
  document.getElementById("signup-error").textContent = "";
}

async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errEl = document.getElementById("login-error");
  errEl.textContent = "";
  try {
    const data = await api("POST", "/api/auth/login", { email, password });
    onAuthSuccess(data.token, email);
  } catch (e) {
    errEl.textContent = e.message;
  }
}

async function handleSignup() {
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const errEl = document.getElementById("signup-error");
  errEl.textContent = "";
  if (!name) { errEl.textContent = "Name is required."; return; }
  if (password.length < 6) { errEl.textContent = "Password must be at least 6 characters."; return; }
  try {
    const data = await api("POST", "/api/auth/signup", { name, email, password });
    onAuthSuccess(data.token, email);
  } catch (e) {
    errEl.textContent = e.message;
  }
}

function onAuthSuccess(jwt, email) {
  token = jwt;
  document.getElementById("auth-screen").style.display = "none";
  document.getElementById("app-screen").style.display = "flex";
  document.getElementById("user-email-display").textContent = email;
  loadTasks();
  connectWS();
}

function handleLogout() {
  token = null;
  if (ws) ws.close();
  document.getElementById("app-screen").style.display = "none";
  document.getElementById("auth-screen").style.display = "flex";
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";
  document.getElementById("task-list").innerHTML = "";
}

// Enter key support for login/signup
document.getElementById("login-password").addEventListener("keydown", e => { if (e.key === "Enter") handleLogin(); });
document.getElementById("signup-password").addEventListener("keydown", e => { if (e.key === "Enter") handleSignup(); });

// ── WEBSOCKET ──────────────────────────────────────────────────────────

function connectWS() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${proto}://${location.host}`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "auth", token }));
  };

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === "auth_success") {
      document.getElementById("ws-banner").style.display = "";
    }
    if (msg.type === "task_created") addOrUpdateTaskCard(msg.task);
    if (msg.type === "task_updated") addOrUpdateTaskCard(msg.task);
    if (msg.type === "task_deleted") removeTaskCard(msg.taskId);
  };

  ws.onclose = () => {
    document.getElementById("ws-banner").style.display = "none";
    // Reconnect after 3s if still logged in
    if (token) setTimeout(connectWS, 3000);
  };
}

// ── TASKS ──────────────────────────────────────────────────────────────

let allTasks = [];

async function loadTasks() {
  try {
    allTasks = await api("GET", "/api/tasks");
    renderTasks();
  } catch (e) {
    console.error("Failed to load tasks:", e);
  }
}

function setFilter(filter) {
  currentFilter = filter;
  const titles = { all: "All Tasks", todo: "To Do", in_progress: "In Progress", done: "Done" };
  document.getElementById("filter-title").textContent = titles[filter];
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
  event.currentTarget.classList.add("active");
  renderTasks();
}

function renderTasks() {
  const filtered = currentFilter === "all" ? allTasks : allTasks.filter(t => t.status === currentFilter);
  const list = document.getElementById("task-list");
  const empty = document.getElementById("empty-state");

  // Remove existing cards (keep empty state)
  list.querySelectorAll(".task-card").forEach(el => el.remove());

  if (filtered.length === 0) {
    empty.style.display = "";
    return;
  }
  empty.style.display = "none";

  filtered.forEach(task => {
    list.appendChild(buildTaskCard(task));
  });
}

function buildTaskCard(task) {
  const card = document.createElement("div");
  card.className = `task-card${task.status === "done" ? " done-card" : ""}`;
  card.dataset.id = task.id;

  const isDone = task.status === "done";
  const overdue = isOverdue(task.due_date) && !isDone;

  card.innerHTML = `
    <div class="task-check ${isDone ? "checked" : ""}" onclick="toggleDone(${task.id}, '${task.status}')">
      ${isDone ? "✓" : ""}
    </div>
    <div class="task-body">
      <div class="task-title-row">
        <span class="task-name ${isDone ? "strikethrough" : ""}">${escHtml(task.title)}</span>
        <span class="badge badge-${task.status}">${statusLabel(task.status)}</span>
        <span class="badge badge-${task.priority}">${capitalize(task.priority)}</span>
      </div>
      ${task.description ? `<div class="task-desc">${escHtml(task.description)}</div>` : ""}
      <div class="task-meta">
        ${task.due_date ? `<span class="task-due ${overdue ? "overdue" : ""}">📅 ${formatDate(task.due_date)}${overdue ? " · Overdue" : ""}</span>` : ""}
      </div>
    </div>
    <div class="task-actions">
      <button class="icon-btn" onclick="openEditModal(${task.id})" title="Edit">✏️</button>
      <button class="icon-btn delete" onclick="deleteTask(${task.id})" title="Delete">🗑️</button>
    </div>
  `;
  return card;
}

function addOrUpdateTaskCard(task) {
  const idx = allTasks.findIndex(t => t.id === task.id);
  if (idx === -1) allTasks.unshift(task);
  else allTasks[idx] = task;
  renderTasks();
}

function removeTaskCard(taskId) {
  allTasks = allTasks.filter(t => t.id !== taskId);
  renderTasks();
}

function statusLabel(s) {
  return { todo: "To Do", in_progress: "In Progress", done: "Done" }[s] || s;
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── TOGGLE DONE ────────────────────────────────────────────────────────

async function toggleDone(id, currentStatus) {
  const newStatus = currentStatus === "done" ? "todo" : "done";
  try {
    const updated = await api("PUT", `/api/tasks/${id}`, { status: newStatus });
    addOrUpdateTaskCard(updated);
  } catch (e) {
    console.error("Toggle failed:", e);
  }
}

// ── DELETE ─────────────────────────────────────────────────────────────

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  try {
    await api("DELETE", `/api/tasks/${id}`);
    removeTaskCard(id);
  } catch (e) {
    console.error("Delete failed:", e);
  }
}

// ── MODAL ──────────────────────────────────────────────────────────────

function openModal() {
  editingTaskId = null;
  document.getElementById("modal-title").textContent = "New Task";
  document.getElementById("task-title").value = "";
  document.getElementById("task-desc").value = "";
  document.getElementById("task-priority").value = "medium";
  document.getElementById("task-status").value = "todo";
  document.getElementById("task-due").value = "";
  document.getElementById("modal-error").textContent = "";
  document.getElementById("modal-overlay").style.display = "flex";
  document.getElementById("task-title").focus();
}

function openEditModal(id) {
  const task = allTasks.find(t => t.id === id);
  if (!task) return;
  editingTaskId = id;
  document.getElementById("modal-title").textContent = "Edit Task";
  document.getElementById("task-title").value = task.title;
  document.getElementById("task-desc").value = task.description || "";
  document.getElementById("task-priority").value = task.priority || "medium";
  document.getElementById("task-status").value = task.status || "todo";
  document.getElementById("task-due").value = task.due_date ? task.due_date.slice(0, 10) : "";
  document.getElementById("modal-error").textContent = "";
  document.getElementById("modal-overlay").style.display = "flex";
  document.getElementById("task-title").focus();
}

function closeModal() {
  document.getElementById("modal-overlay").style.display = "none";
}

function closeModalOnOverlay(e) {
  if (e.target === document.getElementById("modal-overlay")) closeModal();
}

// Close modal on Escape
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

async function saveTask() {
  const title = document.getElementById("task-title").value.trim();
  const description = document.getElementById("task-desc").value.trim();
  const priority = document.getElementById("task-priority").value;
  const status = document.getElementById("task-status").value;
  const dueDate = document.getElementById("task-due").value || null;
  const errEl = document.getElementById("modal-error");
  errEl.textContent = "";

  if (!title) { errEl.textContent = "Title is required."; return; }

  try {
    if (editingTaskId) {
      const updated = await api("PUT", `/api/tasks/${editingTaskId}`, { title, description, priority, status, dueDate });
      addOrUpdateTaskCard(updated);
    } else {
      const created = await api("POST", "/api/tasks", { title, description, priority, dueDate });
      addOrUpdateTaskCard(created);
    }
    closeModal();
  } catch (e) {
    errEl.textContent = e.message;
  }
}