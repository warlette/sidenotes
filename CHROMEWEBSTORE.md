# Chrome Web Store Metadata & Publishing Guide — SideNotes

## General Information

- **Extension Name**: SideNotes - Split View Note Taking
- **Short Name**: SideNotes
- **Category**: Productivity / Workflow
- **Version**: 1.1.2
- **Primary Language**: English

## Store Listing Descriptions

### Short Description (max 132 chars)
Smart split-browser side panel note-taking extension with Markdown support, web page capture, and offline local storage.

### Detailed Description
SideNotes brings a seamless, split-browser note-taking experience directly into Google Chrome's Side Panel—just like having a notes workspace open side-by-side with your active browser tab.

**Key Features:**
- 📌 **Side Panel Workspace**: Docks cleanly on the side of Chrome without overlapping or interfering with web page layouts.
- ⚡ **Instant Web Capture**: 1-click button to capture current page title, URL, page description, and selected text directly into your notes.
- 🖱️ **Right-Click Context Menu Integration**: Highlight text anywhere on the web, right-click, and select "Add selection to active note" or "Create new note from selection".
- 📝 **Markdown Editor & Live Preview**: Format your notes with headings, bold/italic text, checklists, code snippets, blockquotes, and links.
- 🏷️ **Categories & Search**: Organize your notes with categories (General, Research, Ideas, Todo, Web Clips), custom tags, and real-time search.
- 🔄 **Multi-Device Sync**: Sync notes natively via Chrome Account Sync or private GitHub Gists.
- 💾 **100% Offline & Private**: All notes are stored locally in your browser (`chrome.storage.local` / `chrome.storage.sync`). Zero third-party trackers.
- 📤 **Import & Export**: Export notes to Markdown (`.md`), Plain Text (`.txt`), or complete JSON backups.

## Permissions Justification (v1.1.2)

| Permission | Purpose / Justification |
|------------|-------------------------|
| `sidePanel` | Required to display the note-taking application inside Google Chrome's native Side Panel UI. |
| `storage` | Required to store and save user notes, categories, tags, and theme preferences locally on the user's device. |
| `contextMenus` | Required to add right-click options ("Add selection to active note", "Create note from selection") when text is highlighted on web pages. |
| `tabs` | Required to read the title and URL of the active browser tab when the user clicks "Clip Page" or uses context menu shortcuts. |
| `activeTab` | Grants temporary access to the active tab upon explicit user interaction (e.g. clicking context menu or keyboard shortcuts). |
| `scripting` | Required to read user-highlighted text when the user explicitly triggers a web clipping action. |

## Host Permissions

- **Host Permissions Requested**: **NONE** (Zero broad host permissions requested for maximum user privacy and fast-track Web Store review).

## Single Purpose Statement

SideNotes provides a split-browser side panel workspace for taking notes, formatting markdown, and capturing web clips directly alongside active browsing sessions.

## Privacy & Data Use Disclosures

- **User Data Collection**: SideNotes collects **NO** personal data, browsing history, or analytics.
- **Data Storage**: All note contents and metadata are saved strictly on the local device or user-configured private sync. No data is transmitted to external servers.
