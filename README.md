# Pragma

> Structured thought, purposeful action.

Pragma is a local-first kanban app for Windows. Your data lives entirely on your machine — no accounts, no sync, no cloud. Multiple profiles, PIN protection, and a clean interface that stays out of your way.

---

## Features

**Profiles & security**
- Multiple named profiles, each with its own colour
- Optional PIN lock per profile (scrypt-hashed with salt, rate-limited)
- Change or remove PIN from settings

**Pragmas & boards**
- Organise work into Pragmas (projects), each containing multiple boards
- Boards hold Lanes; Lanes hold Cards — drag and drop to reorder anything

**Cards**
- Title, description, priority (none → critical), and due date
- Tag system with custom colours, assignable per card
- Due date chips: overdue (red), due today (amber), upcoming
- Visual indicators for description and tags on the card face

**Customisation**
- 7 built-in themes: Light, Dark, Blue, Violet, Sage, Sand, Mocha
- Theme persists across sessions

**Export & import**
- Export a single board to a `.pragmaboard` file
- Import a board into any Pragma (IDs are remapped; tags are deduplicated by name)
- Export/import a whole Pragma (`.pragma` file)

---

## Installation

Download the latest installer from the [Releases](../../releases) page.

1. Run `Pragma Setup x.x.x.exe`
2. Windows SmartScreen may show a warning — click **More info → Run anyway** (the app is unsigned)
3. Launch from the Start Menu or desktop shortcut

Your data is stored at:
```
C:\Users\<you>\AppData\Roaming\Pragma\pragma.db
```

---

## Development

**Requirements:** Node.js 20+, npm 10+

```bash
git clone https://github.com/FIZZYfizzz/Pragma.git
cd Pragma
npm install
npm run dev
```

**Other scripts**

| Command | Description |
|---|---|
| `npm run dev` | Start in development mode (hot reload) |
| `npm run build` | Production build to `out/` |
| `npm run package` | Build + package to `dist/Pragma Setup x.x.x.exe` |
| `npm run typecheck` | Type-check all TypeScript |
| `npm run icon` | Regenerate `build/icon.ico` |

---

## Tech stack

| Layer | Technology |
|---|---|
| Shell | Electron 33 |
| Build | electron-vite + Vite 5 |
| UI | React 18 + TypeScript 5.7 |
| Styling | Tailwind CSS v4 |
| State | Zustand + Immer |
| Drag & drop | dnd-kit |
| Database | better-sqlite3 (SQLite, local-first) |
| Packaging | electron-builder (NSIS, Windows x64) |

---

## License

MIT © Shaun
