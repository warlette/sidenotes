# 📝 SideNotes — Chrome Side Panel Note Extension (v1.1.2)

**SideNotes** is a split-browser note-taking extension built using Chrome Manifest V3 and the native `chrome.sidePanel` API. It allows you to take notes, capture web clips, and organize research right next to your active web pages—similar to having ChatGPT/Claude side panel tools available while browsing.

---

## ✨ Features

- 📌 **Native Chrome Side Panel**: Docks cleanly alongside your browsing tabs without interrupting web page layouts.
- ⚡ **1-Click Web Capture**: Capture the active tab's title, URL, page description, and user-selected text directly into your notes.
- 🖱️ **Context Menu Integration**: Highlight text on any website, right-click, and choose:
  - *📌 Add selection to active note*
  - *✨ Create new note from selection*
- 📝 **Markdown Editor & Live Preview**: Support for headings, bold/italic, strikethrough, checklists, blockquotes, code blocks, and links.
- 🏷️ **Categories, Tags, & Search**: Filter notes by category (General, Research, Ideas, Todo, Web Snippets), custom tags, or real-time keyword search.
- 💾 **100% Offline & Canonical Local Storage**: All notes stored safely in `chrome.storage.local` with zero quota limits or internet dependencies.
- 🔄 **Optional GitHub Gist Sync (Advanced)**: Sync notes across devices using your private GitHub Gist with a Personal Access Token (PAT).
- 📤 **Export & Import**: Export notes as Markdown (`.md`), Text (`.txt`), or full JSON backup (`.json`).
- 🎨 **Dark & Light Mode**: Styled with the Impeccable Design System and instant dark/light theme toggle.

---

## 🔒 Privacy & Data Protection

- **Local-First Default**: All notes, titles, categories, and tags are stored strictly on your local computer (`chrome.storage.local`).
- **No Third-Party Tracking**: Zero analytics, zero ad trackers, zero third-party telemetry.
- **Optional Gist Backup**: If you explicitly configure GitHub Gist sync, note data is transmitted to your private GitHub Gist using your token. Your token is stored locally and is never shared, logged, or exported.

---

## 🚀 How to Install in Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** using the toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the project directory:
   `/Users/warlette/Devs/my-projects/chrome-extension/notes`
5. Click on the extension icon in the Chrome toolbar or press `Command+Shift+N` (Mac) or `Ctrl+Shift+N` (Windows/Linux) to open SideNotes!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+N` / `Ctrl+Shift+N` | Toggle SideNotes Panel |
| `Alt + N` | Create New Note |
| `Alt + S` | Toggle Notes Drawer |
| `Cmd+S` / `Ctrl+S` | Save Note |

---

## 📁 Project Structure

```
/notes
├── manifest.json            # Manifest V3 Configuration (v1.1.2)
├── service-worker.js        # Background Service Worker & Context Menus
├── package.json             # Build & packaging scripts
├── package.js               # Automated release packager script
├── CHROMEWEBSTORE.md        # Store Listing & Permissions Justifications
├── privacy.html             # Standalone Privacy Policy Page
├── icons/                   # Custom Icons (16x16, 32x32, 48x48, 128x128)
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── sidepanel/               # Side Panel UI Application
│   ├── sidepanel.html
│   ├── sidepanel.css
│   └── sidepanel.js
└── docs/                    # Store submission content & assets
    ├── sidenotes-store-submission.md
    └── store-assets/
```
