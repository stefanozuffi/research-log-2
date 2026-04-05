# ⊢ research_log

A personal desktop dashboard for tracking research directions, learning, opportunities, and goals.

Built with Electron + vanilla JS. No build step.

---

## Quick Start

```bash
# 1. Make sure you have Node.js installed (v18+ recommended)
node --version

# 2. Install dependencies
npm install

# 3. Run the app
npm start
```

That's it. The app window opens and your data persists between sessions.

---

## Working with Claude Code

This project includes a `CLAUDE.md` file that gives Claude Code full context about the codebase. Here's how to use them together effectively:

### Setup

```bash
# Install Claude Code if you haven't already
npm install -g @anthropic-ai/claude-code

# Navigate to the project directory
cd research-log

# Start Claude Code
claude
```

Claude Code will automatically read `CLAUDE.md` and understand the project structure.

### Example prompts to try

**Adding features:**
```
Add a "resources" tab where I can save links to papers, repos, and courses with tags
```

```
Add keyboard shortcuts: n to create new item, / to focus search, Escape to close modals
```

```
Add a search bar that filters across all tabs
```

**Improving the UI:**
```
Add a progress bar to learning items — I want to set percentage completion
```

```
Make the overview tab show a timeline of upcoming deadlines
```

```
Add smooth transition animations when switching tabs
```

**Code quality:**
```
Refactor app.js — split the modal logic into its own file
```

```
Add JSDoc comments to the main functions in app.js
```

### Workflow tips

1. **Keep the app running** while you work with Claude Code. After Claude makes changes, just press `Cmd+R` in the Electron window to see them.

2. **Be specific** about which file to edit. Example: "In `src/renderer/app.js`, add a function that..." is better than "add a feature that..."

3. **Iterate in small steps.** Ask for one feature at a time, test it, then move on.

4. **Use Claude Code for debugging.** If something looks off, you can say: "The modal doesn't close when I click save — debug this in app.js"

---

## Project Structure

```
research-log/
├── package.json              # Dependencies & scripts
├── src/
│   ├── main.js               # Electron main process
│   ├── preload.js            # Bridges storage API to renderer
│   └── renderer/
│       └── app.js            # All UI logic (vanilla JS)
├── public/
│   ├── index.html            # Entry point
│   └── styles.css            # All styles
├── CLAUDE.md                 # Context file for Claude Code
└── README.md                 # This file
```

## Data Storage

Your data is saved locally at:
- **macOS**: `~/Library/Application Support/research-log/research-log-data.json`
- **Linux**: `~/.config/research-log/research-log-data.json`
- **Windows**: `%APPDATA%/research-log/research-log-data.json`

To back up your data, copy that file. To reset, delete it.

---

## License

MIT — personal project, do whatever you want with it.
