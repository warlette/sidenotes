# Chrome Web Store Metadata & Publishing Guide — SideNotes

## General Information

- **Extension Name**: SideNotes - Split View Note Taking
- **Short Name**: SideNotes
- **Category**: Productivity / Workflow
- **Version**: 1.0.0
- **Primary Language**: English

## Store Listing Descriptions

### Short Description (max 132 chars)
Smart split-browser side panel note-taking extension with Markdown support, web page capture, and offline local storage.

### Detailed Description
SideNotes brings a seamless, split-browser note-taking experience directly into Google Chrome's Side Panel—just like having a notes workspace open side-by-side with your active browser tab.

**Key Features:**
- 📌 **Side Panel Workspace**: Docks cleanly on the side of Chrome without overlapping or interfering with web page layouts.
- ⚡ **Instant Web Capture**: 1-click button to capture current page title, URL, and selected text directly into your notes.
- 🖱️ **Right-Click Context Menu Integration**: Highlight text anywhere on the web, right-click, and select "Add selection to active note" or "Create new note from selection".
- 📝 **Markdown Editor & Live Preview**: Format your notes with headings, bold/italic text, checklists, code snippets, blockquotes, and links.
- 🏷️ **Categories & Search**: Organize your notes with categories (General, Research, Ideas, Todo, Web Clips), custom tags, and real-time search.
- 💾 **100% Offline & Private**: All notes are stored locally in your browser (`chrome.storage.local`). Zero third-party trackers or servers.
- 📤 **Import & Export**: Export notes to Markdown (`.md`), Plain Text (`.txt`), or complete JSON backups.

## Permissions Justification

| Permission | Purpose / Justification |
|------------|-------------------------|
| `sidePanel` | Required to display the note-taking application inside Google Chrome's native Side Panel UI. |
| `storage` | Required to store and save user notes, categories, tags, and theme preferences locally on the user's device (`chrome.storage.local`). |
| `contextMenus` | Required to add right-click options ("Add selection to active note", "Create note from selection") when text is highlighted on web pages. |
| `tabs` | Required to read the title and URL of the active browser tab when the user clicks "Clip Page" or uses context menu shortcuts. |
| `scripting` | Required to communicate with active tabs to capture user-selected text cleanly from web pages. |
| `activeTab` | Required to access temporary context from the active tab during explicit user gestures. |

## Host Permissions Justification

| Host Permission | Justification |
|-----------------|---------------|
| `<all_urls>` | Required so the user can capture page title, URL, and text snippets from any website they choose to clip notes from. |

## Single Purpose Statement

SideNotes provides a split-browser side panel workspace for taking notes, formatting markdown, and capturing web clips directly alongside active browsing sessions.

## Privacy & Data Use Disclosures

- **User Data Collection**: SideNotes collects **NO** personal data, browsing history, or analytics.
- **Data Storage**: All note contents and metadata are saved strictly on the local device using `chrome.storage.local`. No data is transmitted to external servers.
