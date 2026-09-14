# ProCode - College DSA & Coding Practice Platform

A curriculum-aligned competitive coding and DSA training platform built for college students, faculty hosts, and university exam preparation.

---

## 🚀 How to Run in VS Code (Quickest Methods)

### Method 1: Single-Click Unified Server (Recommended)
This runs **both the frontend and backend together** on a single port (`http://localhost:5000`).

1. Open **VS Code** and open the `pro-code3` folder.
2. Open the built-in terminal (`Ctrl + ~` or `Terminal -> New Terminal`).
3. Run:
   ```powershell
   .\run.bat
   ```
4. Open your browser and go to:
   👉 **http://localhost:5000**

---

### Method 2: Development Mode (Hot-Reload)
This runs the backend on port `5000` and the Vite dev server with instant hot-reload on port `3000`.

1. In VS Code terminal:
   ```powershell
   .\run-dev.bat
   ```
2. Open your browser at:
   👉 **http://localhost:3000**

---

### Method 3: Manual Terminal Commands in VS Code

If you prefer running manual commands in two side-by-side terminal tabs in VS Code:

#### Terminal 1 (Backend Server):
```powershell
cd procode\server
node index.js
```
*(Starts backend on `http://localhost:5000`)*

#### Terminal 2 (Frontend Client):
```powershell
cd procode\client
npm run dev
```
*(Starts React Vite frontend on `http://localhost:3000`)*

---

## 🔑 Accounts & Authentication

- **No Dummy Students**: All dummy / fake student demo accounts (Rahul, Priya, Arjun, mock submissions) have been completely removed. Student registrations now start completely fresh.
- **Host / Faculty Administrator Account**:
  - **Email**: `admin@procode.edu`
  - **Password**: `Admin@123`
  - **Access**: Full access to Question Creator, Problem Editor, Exam Papers Manager, Maintenance Mode Switch, and Cheating Reports Console.

---

## 🎨 Professional Developer Aesthetic Overhaul
- **Dark Obsidian Palette**: `#0B0F17` background with subtle `#1E293B` borders.
- **Executive Tech Blue Accents**: Primary action elements, tabs, focus states, and badges use clean blue (`#3B82F6` / `#2563EB`).
- **Zero Garish Gradients**: Replaced loud amber and rainbow gradients with crisp, high-contrast engineering UI styling.