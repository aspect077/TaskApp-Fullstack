# ✅ TaskApp — Full Stack Task Management System

A full-stack task management web app with JWT authentication, real-time updates via WebSockets, and a clean responsive UI — built entirely with vanilla HTML/CSS/JS on the frontend and Node.js/Express on the backend.

🔗 **Live Demo:** https://taskapp-fullstack-production.up.railway.app/
📁 **Repo:** https://github.com/aspect077/TaskApp-Fullstack

---

## ✨ Features

- 🔐 **JWT Authentication** — secure signup & login, passwords hashed with bcrypt
- 📋 **Full Task CRUD** — create, edit, delete, and mark tasks as done
- 🎯 **Status Filters** — All, To Do, In Progress, Done
- ⚡ **Real-Time Sync** — open the app in two tabs; changes in one appear instantly in the other via WebSockets
- 🚩 **Priority Levels** — Low, Medium, High
- 📅 **Due Dates** — with automatic overdue detection
- 📱 **Responsive Design** — works on desktop and mobile
- 🔒 **User-Scoped Data** — every task is tied to its owner; users can never see or modify another user's tasks

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | SQLite (`node:sqlite`) |
| Auth | JSON Web Tokens (JWT), bcryptjs |
| Real-time | WebSockets (`ws`) |
| Frontend | HTML5, CSS3, Vanilla JavaScript |

---

## 🏗️ Architecture Overview

```
┌─────────────────┐         HTTP (REST)        ┌──────────────────┐
│                  │ ───────────────────────────▶│                  │
│   Frontend       │                              │   Express API    │
│  (public/*)      │ ◀───────────────────────────│  (server/*)      │
│                  │         JSON responses       │                  │
└────────┬─────────┘                              └─────────┬────────┘
         │                                                   │
         │           WebSocket (live updates)                │
         └──────────────────────────────────────────────────▶│
                                                               │
                                                     ┌─────────▼────────┐
                                                     │  SQLite Database │
                                                     │  (taskapp.db)    │
                                                     └───────────────────┘
```

**Request flow:**
1. The browser loads `public/index.html`, `style.css`, and `app.js` — served as static files by Express (`express.static`)
2. Login/signup calls hit `/api/auth/*`, which issues a **JWT** on success
3. Every subsequent request (tasks) attaches that JWT in the `Authorization` header
4. `requireAuth` middleware verifies the token and attaches `req.userId` before any task route runs
5. Task routes read/write to **SQLite**, scoped to `req.userId`
6. After any task mutation (create/update/delete), the server calls `broadcastToUser()`, which pushes a message over **WebSocket** to every other open tab/device logged into that same account
7. The frontend's WebSocket listener (`connectWS()` in `app.js`) receives that message and updates the UI live, without a page refresh

**Why this design:**
- **Stateless auth (JWT)** — no server-side session store needed; scales easily, and the same token works across REST calls and the WebSocket handshake
- **Single HTTP server for both REST + WebSocket** — `http.createServer(app)` is shared by Express and the `ws` WebSocket server, so both run on the same port with no extra infrastructure
- **SQLite via `node:sqlite`** — zero native build dependencies (avoids the `better-sqlite3` Windows compilation issue), good enough for a single-instance app like this

---

## 📂 Project Structure

```
taskapp-fullstack/
├── server/
│   ├── config/
│   │   └── db.js              # SQLite connection + table creation
│   ├── models/
│   │   ├── User.js            # User queries
│   │   └── Task.js            # Task queries (scoped by user)
│   ├── middleware/
│   │   └── auth.js            # JWT sign + verify middleware
│   ├── routes/
│   │   ├── auth.js            # /api/auth/signup, /api/auth/login
│   │   └── tasks.js           # /api/tasks CRUD routes
│   ├── ws.js                  # WebSocket connection manager
│   └── index.js                # App entry point
├── public/
│   ├── index.html              # Single-page app shell
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js              # Frontend logic (auth, tasks, WebSocket client)
├── .env                         # PORT, JWT_SECRET, JWT_EXPIRES_IN
├── .gitignore
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js **v22.5+** (uses the built-in `node:sqlite` module)

### Installation

```bash
git clone https://github.com/aspect077/TaskApp-Fullstack.git
cd TaskApp-Fullstack
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
PORT=3000
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
```

### Run the App

```bash
node server/index.js
```

Visit **http://localhost:3000** in your browser.

---

## 📡 API Reference

### Auth

| Method | Endpoint | Description | Body |
|---|---|---|---|
| POST | `/api/auth/signup` | Create a new account | `{ name, email, password }` |
| POST | `/api/auth/login` | Log in, get a JWT | `{ email, password }` |

### Tasks _(all require `Authorization: Bearer <token>` header)_

| Method | Endpoint | Description | Body |
|---|---|---|---|
| GET | `/api/tasks` | List all tasks for the logged-in user | — |
| POST | `/api/tasks` | Create a new task | `{ title, description, priority, dueDate }` |
| PUT | `/api/tasks/:id` | Update a task | `{ title, description, status, priority, dueDate }` |
| DELETE | `/api/tasks/:id` | Delete a task | — |

---

## ⚡ Real-Time Updates (WebSocket)

On connect, the client authenticates with:
```json
{ "type": "auth", "token": "<jwt>" }
```

The server then pushes live events to that user's open connections:
- `task_created`
- `task_updated`
- `task_deleted`

This means multiple open tabs/devices for the same account stay in sync without polling or manual refresh.

---

## 🔒 Security Notes

- Passwords are hashed with **bcrypt** (10 salt rounds) — never stored as plain text
- JWTs are signed with a server-side secret and expire after a configurable period
- Every task query is scoped to `req.userId`, so there is no way for one user to access another user's data

---

## 🩹 Common Issues

| Problem | Cause | Fix |
|---|---|---|
| `MODULE_NOT_FOUND` when running `node server/index.js` | Running the command from inside `server/` instead of the project root | `cd` back to the project root first, then run `node server/index.js` |
| `Cannot find module 'node:sqlite'` | Node version too old | Upgrade to **Node v22.5+** — this module is built-in but not present in older versions |
| Files appear empty (0 bytes) after creating them manually | Some Windows text editors save incorrectly when pasting large code blocks | Recreate the file and paste again, or use a code editor like VS Code instead of Notepad |
| WebSocket `connect-src` / Content Security Policy error in console | Testing the WebSocket from a blank browser tab (`about:blank`) — Chrome blocks this by default | Test from `http://localhost:3000` directly instead of a blank tab, or use Firefox |
| `Failed to fetch` on signup/login | Backend server isn't running, or was closed accidentally | Restart it: `node server/index.js`, then refresh the page |
| Signup fails with "Name, email, and password are all required" | Frontend form is missing the `name` field, or `app.js` isn't sending it | Make sure both `index.html` (signup form) and `app.js` (`handleSignup()`) include the `name` field |
| PowerShell command fails with a parse error | Two commands pasted on the same line, e.g. `$token = $login.token Invoke-RestMethod...` | Run each PowerShell command on its own line, one at a time |
| Deleting/recreating the project folder wipes all users & tasks | `taskapp.db` lives inside the project folder and isn't tracked by git (it's in `.gitignore`) | This is expected — re-run signup after a fresh clone/extract |

---

## 🧪 Testing

Manual end-to-end test checklist used during development:

1. **Auth**
   - [ ] Sign up with a new email — should redirect into the app and show the task dashboard
   - [ ] Log out, then log back in with the same credentials — should succeed
   - [ ] Try logging in with a wrong password — should show an error, not crash

2. **Task CRUD**
   - [ ] Create a task with a title, description, priority, and due date
   - [ ] Edit that task and change its status
   - [ ] Mark a task as done by clicking the checkbox
   - [ ] Delete a task — should disappear immediately

3. **Filters**
   - [ ] Switch between All / To Do / In Progress / Done — list should update correctly

4. **Real-time sync (WebSocket)**
   - [ ] Open the app in two browser tabs, logged into the same account
   - [ ] Create/edit/delete a task in one tab
   - [ ] Confirm it appears/updates/disappears in the other tab **without refreshing**
   - [ ] Look for the **⚡ Live updates active** banner — confirms the WebSocket connection is open

5. **Data isolation**
   - [ ] Sign up a second account
   - [ ] Confirm it sees an empty task list, not the first account's tasks

> No automated test suite is included yet — see Roadmap below.

---

## 📌 Roadmap / Possible Improvements

- [ ] Automated test suite (unit + integration tests)
- [ ] Admin dashboard to view registered users
- [ ] Task search and sorting
- [ ] Email verification on signup
- [ ] Dark mode toggle
- [ ] Drag-and-drop task reordering between status columns

---

## 👤 Author

**Ankit Sinha**
- GitHub: [@aspect077](https://github.com/aspect077)
- Email: sinhaankit.vfstr@gmail.com

---

## 📄 License

This project was built as part of an internship assignment and is free to use for learning purposes.