# 🐉 Kali Linux Terminal — Real Linux Shell in Your Browser

A **production-ready**, browser-based Linux terminal powered by:
- **xterm.js** — full-featured terminal emulator in the browser
- **node-pty** — real pseudo-terminal on the server
- **Docker** — isolated Ubuntu sandbox per user session
- **Socket.io** — real-time bidirectional WebSocket communication
- **Next.js** — modern React frontend

```
Browser (xterm.js)
       │
   WebSocket (Socket.io)
       │
Node.js + Express + Socket.io
       │
   node-pty (real PTY)
       │
Docker Container (Ubuntu 22.04)
       │
  Real Linux Commands
```

---

## 📁 Project Structure

```
linux-terminal/
├── frontend/          # Next.js 14 + xterm.js + TailwindCSS
├── backend/           # Node.js + Express + Socket.io + node-pty
├── docker/
│   ├── Dockerfile.sandbox    # Ubuntu 22.04 with full dev toolkit
│   └── Dockerfile.backend    # Production backend image
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js >= 20
- Docker Desktop (for container isolation)
- Windows: Visual Studio C++ Build Tools (for node-pty native compilation)

### Step 1 — Copy environment config
```bash
cp .env.example .env
```

### Step 2 — Build the sandbox Docker image
```bash
docker build -f docker/Dockerfile.sandbox -t linux-terminal-sandbox .
```
> ⚠️ This takes 5–15 minutes on first build (downloading Ubuntu + all tools).

### Step 3 — Install dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 4 — Run in dev mode

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** 🎉

---

## 🐳 Docker Compose (Production)

```bash
# Build sandbox image first
docker build -f docker/Dockerfile.sandbox -t linux-terminal-sandbox .

# Start everything
docker-compose up --build

# Open http://localhost:3000
```

---

## 🖥️ Without Docker (Direct Shell Mode)

If Docker is not available, the backend spawns a shell directly on the host:

```env
# In .env
USE_DOCKER=false
```

> ⚠️ This runs commands on your host machine without sandbox isolation. **Development only!**

---

## ✨ Features

| Feature | Status |
|---|---|
| Real PTY via node-pty | ✅ |
| Docker container per session | ✅ |
| Multi-tab terminal | ✅ |
| File explorer (tree view) | ✅ |
| Drag-and-drop upload | ✅ |
| File download | ✅ |
| Ctrl+C / Ctrl+D / Ctrl+L | ✅ |
| Arrow keys + history | ✅ |
| Tab completion | ✅ |
| Terminal resize (FitAddon) | ✅ |
| Scrollback buffer (10,000 lines) | ✅ |
| Session auto-cleanup (30min idle) | ✅ |
| Rate limiting | ✅ |
| Resource limits (memory/CPU) | ✅ |
| Dark Kali-style UI | ✅ |
| Resizable sidebar | ✅ |
| Fullscreen support | ✅ |
| Status bar + health monitor | ✅ |

## 🔒 Security

- Each user session gets an **isolated Docker container**
- Containers run as **non-root user** (`user:user`)
- Dropped capabilities: `--cap-drop=ALL` + only needed caps added
- `--security-opt=no-new-privileges`
- Memory limit: 256m, CPU limit: 0.5 cores, PIDs limit: 100
- Sessions auto-destroyed after 30min idle
- Rate limiting: 200 req/min per IP

## 🛠️ Supported Tools in Sandbox

Python · Node.js · npm · Git · GCC · G++ · Clang · Go · Rust/Cargo · PHP · Ruby · Perl · Java (OpenJDK) · curl · wget · ping · nmap · netcat · nmap · nano · vim · tree · zip · unzip · SQLite · MySQL client · tcpdump · and more.
