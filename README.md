# AI Browser Automation

> Describe a task → AI plans the steps → GitHub Actions runs Playwright → screenshots return to your browser.

**Stack:** [Puter.js](https://js.puter.com) (`poolside/laguna-m.1:free`) · [Playwright](https://playwright.dev) · [GitHub Actions](https://github.com/marketplace/actions/playwright-container)

---

## How It Works

```
index.html (GitHub Pages)
  │
  ├─ 1. You describe the task + paste your GitHub token
  │
  ├─ 2. Puter.js calls poolside/laguna-m.1:free  →  returns JSON step plan
  │
  ├─ 3. Frontend triggers  workflow_dispatch  on this repo
  │
  ├─ 4. GitHub Actions runner:
  │       └─ playwright-container  →  playwright-runner.js
  │             reads STEPS_JSON, executes steps, saves screenshots
  │
  └─ 5. Frontend polls GitHub API for the artifact
         └─ Renders each step + screenshot inline
```

---

## Setup (5 minutes)

### 1 · Fork / Clone this repo

```bash
git clone https://github.com/YOUR_USERNAME/ai-browser-automation
cd ai-browser-automation
```

### 2 · Enable GitHub Pages

Go to **Settings → Pages → Source → Deploy from branch → `main` → `/` (root)** → Save.

Your `index.html` will be live at:
```
https://YOUR_USERNAME.github.io/ai-browser-automation/
```

### 3 · Create a GitHub Personal Access Token

1. Go to **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Give it a name, set expiry, and check **`workflow`** scope
4. Copy the token — you'll paste it into the UI

> The token is **never stored**. It's only held in memory while the page is open.

### 4 · Open the page and automate!

1. Visit your GitHub Pages URL
2. Fill in **Repo** (`your-username/ai-browser-automation`)
3. Paste your **GitHub Token**
4. Enter a **Starting URL** (e.g. `https://news.ycombinator.com`)
5. Describe your task in natural language
6. Click **Generate Plan & Run Automation**

---

## Example Tasks

| Task | What happens |
|------|-------------|
| `Go to Hacker News, click the top story, screenshot the article` | 3-step plan: navigate → click → screenshot |
| `Search for "playwright" on GitHub, click first result` | navigate → fill search → press Enter → click |
| `Open Wikipedia, search for "browser automation", scroll down` | navigate → click → fill → press Enter → scroll |

---

## File Structure

```
ai-browser-automation/
├── index.html              ← Frontend (deploy on GitHub Pages)
├── playwright-runner.js    ← Node.js script run by GitHub Actions
├── package.json            ← Playwright dependency
└── .github/
    └── workflows/
        └── playwright.yml  ← GitHub Actions workflow
```

---

## Local Development

```bash
npm install

# Test a specific automation locally
STEPS_JSON='{"startUrl":"https://example.com","steps":[{"description":"Visit site","action":"navigate","selector":"","value":"https://example.com"},{"description":"Screenshot","action":"screenshot","selector":"","value":""}]}' node playwright-runner.js

# Results saved to ./results/
```

---

## AI Model

Uses **`poolside/laguna-m.1:free`** via Puter.js — no API key needed, free to use.
The model receives your task description and returns a structured JSON plan of Playwright steps.

---

## Limitations

- Artifact downloads from **private repos** require the GitHub token to have `actions:read` scope in addition to `workflow`
- The GitHub API rate limit is **5,000 requests/hour** for authenticated requests
- Workflow runs time out after **15 minutes**
- Screenshots are captured after **every step** automatically

---

## License

MIT
