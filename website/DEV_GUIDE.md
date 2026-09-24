# D7017E Documentation Website

This directory contains the source code for the project documentation website hosted on GitHub Pages.

## Structure

```
website/
├── index.html               # Landing page with placeholders for title and description
├── activity.html            # Activity log tracker with live sync, filters & search
├── groups.html              # Working groups (G1, G2, G3) details
├── README.md                # Symlink to repository root README.md
├── css/
│   ├── main.css             # Unified styling, theme support (light/dark), layout
│   └── activity.css         # Activity timeline, badges, filters, animations
├── js/
│   ├── main.js              # Theme manager & mobile navigation
│   ├── log-parser.js        # Universal activity log parser (Node.js & browser)
│   └── activity.js          # Activity controller (sync, search, render)
├── data/
│   └── activity-log.json    # Compiled structured activity log data
├── scripts/
│   ├── serve.js             # Local development server with auto-sync & live README support
│   ├── sync-activity-logs.js # Node.js sync script for README.md -> activity-log.json
│   └── sync-activity-logs.py # Python alternative sync script
├── tests/
│   ├── log-parser.test.js   # Unit test suite for log parser
│   └── site-integrity.test.js # Integrity test suite for pages, assets, and sync
└── package.json             # NPM scripts and dev tooling
```

## How the Activity Log Works

As defined in `CONTRIBUTING.md`:
> **README is the log, docs are the state.** Log entries are never edited to stay current; documents always are.

When someone adds a new log entry in `README.md` under `## Activity log` following the format:
```markdown
- YYYY-MM-DD — [G1|G2|G3|ALL] who — what happened. → [doc](path)
```

The website updates seamlessly:

1. **Automated CI/CD Deployment**:
   The GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) runs on every push to `main` touching `README.md` or `website/`. It executes `node website/scripts/sync-activity-logs.js` to compile the newest log entries into `website/data/activity-log.json` and deploys the site to GitHub Pages.

2. **Local Development & Unpushed Changes**:
   When testing locally or reloading the app, the client directly parses the repository's local `README.md` in real-time using `log-parser.js`. Any unpushed local entries display immediately without requiring a remote push or manual rebuild.

3. **Live In-Browser Fetch**:
   On the Activity Log page (`activity.html`), users can click **"Sync Live"** (or let the page auto-check) to fetch the raw `README.md` directly from the repository.

## Local Development & Testing

Run tests:
```bash
npm test --prefix website
# or
node --test website/tests/*.test.js
```

Serve website locally with auto-sync:
```bash
# Start local dev server (recommended: auto-syncs README changes on save)
npm start --prefix website
# or
npm run serve --prefix website
```
Then visit `http://localhost:8000`.

Sync logs manually:
```bash
# Using Node
npm run sync --prefix website

# Watch mode (automatically resyncs when README.md is edited)
npm run sync:watch --prefix website

# Using Python
npm run sync:py --prefix website
```
