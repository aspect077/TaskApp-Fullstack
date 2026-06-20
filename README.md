# ✅ TaskApp — Full Stack Task Management System

A full-stack task management web app with JWT authentication, real-time updates via WebSockets, and a clean responsive UI — built entirely with vanilla HTML/CSS/JS on the frontend and Node.js/Express on the backend.

🔗 **Live Demo:** _add your Railway URL here_
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

## 📌 Roadmap / Possible Improvements

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