# 📝 SideNotes - Chrome Side Panel Note Extension

**SideNotes** is a split-browser note-taking extension built using Chrome Manifest V3 and the native `chrome.sidePanel` API. It allows you to take notes, capture web clips, and organize research right next to your active web pages—similar to having ChatGPT/Claude side panel tools available while browsing.

---

## ✨ Features

- 📌 **Native Chrome Side Panel**: Docked right alongside your browsing tabs without interrupting page layout.
- ⚡ **1-Click Web Capture**: Capture the active tab's title, URL, and selected text directly into your notes.
- 🖱️ **Context Menu Integration**: Highlight text on any website, right-click, and choose:
  - *📌 Add selection to active note*
  - *✨ Create new note from selection*
- 📝 **Markdown Editor & Live Preview**: Support for headings, bold/italic, strikethrough, checklists, blockquotes, code blocks, and links.
- 🏷️ **Categories, Tags, & Search**: Filter notes by category (General, Research, Ideas, Todo, Web Snippets), tags, or live keyword search.
- 💾 **100% Offline & Private**: All notes stored safely in `chrome.storage.local`.
- 📤 **Export & Import**: Export notes as Markdown (`.md`), Text (`.txt`), or full JSON backup.
- 🎨 **Dark & Light Mode**: Sleek glassmorphic theme with instant toggle.

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
| `Cmd+Shift+N` / `Ctrl+Shift+N` | Toggle Side Notes Panel |
| `Alt + N` | Create New Note |
| `Alt + S` | Toggle Notes Drawer |
| `Cmd+S` / `Ctrl+S` | Save Note |

---

## 📁 Project Structure

```
/notes
├── manifest.json            # Manifest V3 Configuration
├── service-worker.js        # Background Service Worker & Context Menus
├── content.js               # Web Page Context Collector Script
├── CHROMEWEBSTORE.md        # Store Listing & Permissions Justifications
├── generate_icons.js        # PNG Icon Generator Script
├── icons/                   # Generated PNG Icons (16x16, 48x48, 128x128)
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── sidepanel/               # Side Panel UI Application
    ├── sidepanel.html
    ├── sidepanel.css
    └── sidepanel.js
```
