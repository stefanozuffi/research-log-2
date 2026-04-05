# CLAUDE.md — Project Context for Claude Code

## Project Overview
**research_log** is a personal desktop dashboard (Electron + vanilla JS) for tracking research directions, learning tracks, opportunities, writing projects, and career goals. Built for a researcher at the intersection of mathematical logic, AI safety, and neurosymbolic AI.

## Architecture
```
research-log/
├── package.json              # Electron + electron-store deps
├── src/
│   ├── main.js               # Electron main process (window, IPC, storage)
│   ├── preload.js            # Context bridge exposing storage API to renderer
│   └── renderer/
│       └── app.js            # Full UI logic (vanilla JS, no framework)
├── public/
│   ├── index.html            # Entry HTML (loads styles.css + app.js)
│   └── styles.css            # All styles
├── CLAUDE.md                 # This file
└── README.md
```

## Key Design Decisions
- **No build step**: Vanilla JS, no React/Vite/webpack. `npm install && npm start` just works.
- **electron-store**: Persistent JSON storage on disk. Accessed via IPC from renderer through the preload bridge (`window.storage.get/set/delete/list`).
- **Single data key**: All app data stored under `"stefano-dashboard-v2"` as one JSON blob. This avoids multiple sequential storage calls.
- **DOM helper**: `h(tag, attrs, ...children)` is a lightweight createElement wrapper used throughout `app.js`. It's NOT React — no virtual DOM, no diffing. `render()` does a full rebuild of `#app` innerHTML each time.

## Data Shape
```js
{
  learning: [{ id, title, status, category, notes }],
  opportunities: [{ id, title, detail, status, deadline, notes }],
  writings: [{ id, title, detail, status, notes }],
  goals: { short: string, medium: string, long: string }
}
```

**Status values**: active, upcoming, done, idea, researching, in-progress, applied, accepted, paused
**Category values** (learning only): ai-safety, math, ml, philosophy, swe

## Common Tasks

### Adding a new tab or section
1. Add tab name to `TABS` array in `app.js`
2. Create a `renderNewTab()` function
3. Add the case to the `switch` in `render()`
4. (Optional) Add styles to `styles.css`

### Adding a new data type
1. Add default array to `INITIAL_DATA`
2. Create card renderer (see `learningCard` or `genericCard` as templates)
3. Add modal support in `openModal()` — handle the new type's fields
4. Wire up the list key mapping in save/delete

### Changing styles
All styles are in `public/styles.css`. The app uses a dark GitHub-inspired theme:
- Background: `#0d1117`
- Card bg: `#161b22`
- Borders: `#21262d`
- Text: `#c9d1d9` (body), `#e6edf3` (bright), `#484f58` (muted)
- Accent: `#58a6ff`

### Running and testing
```bash
npm install
npm start
```
No build step needed. Changes to `app.js` or `styles.css` are reflected on reload (Cmd+R in the Electron window).

## Gotchas
- `render()` does a full DOM rebuild. If you add inputs outside modals, they'll lose focus on re-render. Use modals for editing, or switch to targeted DOM updates for that section.
- The `titleBarStyle: "hiddenInset"` gives macOS-native traffic lights. The header has `-webkit-app-region: drag` so it doubles as a title bar drag area. Buttons/inputs are excluded with `no-drag`.
- electron-store saves to `~/Library/Application Support/research-log/` on macOS.

## Future Feature Ideas (for Stefano to build)
- [ ] Markdown rendering in notes fields
- [ ] Progress bars / completion tracking for learning items
- [ ] Links/resources field for each item
- [ ] Tags system across items
- [ ] Timeline/calendar view of deadlines
- [ ] Export data as markdown or JSON
- [ ] Search/filter across all items
- [ ] Keyboard shortcuts (j/k navigation, n for new, / for search)
