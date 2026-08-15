# SideNotes — Chrome Web Store submission content

Prepared and verified from the `sidenotes-v1.1.2.zip` package (version 1.1.2).

## Status: Ready for Fast-Track Submission (v1.1.2)

All store compliance requirements verified:

- [x] **Broad Host Permissions Removed**: Removed `<all_urls>` host permissions entirely to eliminate store review delays.
- [x] **`activeTab` Permission Used**: Added `activeTab` permission for secure, on-demand active tab access upon explicit user interaction.
- [x] **External Google Fonts `<link>` tags removed**: Native system font stacks used for 100% offline compliance.
- [x] **Version bumped to `1.1.2`** and versioned ZIP `sidenotes-v1.1.2.zip` built and verified.

---

## Store listing

### Name

SideNotes — Side Panel Notes

### Summary (maximum 132 characters)

Take Markdown notes in Chrome's side panel, clip page links and selected text, and keep everything stored locally.

### Detailed description

SideNotes gives you a focused note-taking workspace in Chrome's native side panel, so you can write and organize notes without leaving the page you are viewing.

Create Markdown-formatted notes, save links to useful pages, or highlight text on a website and add it to a note from Chrome's right-click menu or the Clip Page button. Notes are stored locally in your Chrome profile or user-configured private sync.

Features:

- Write notes beside the page you are viewing
- Format notes with headings, emphasis, lists, checklists, quotations, code blocks, and links
- Save the active page's title, URL, description, and selected text into a note
- Add highlighted website text to an existing note or create a new note from it
- Organize notes with categories, tags, pinned items, and search
- Preview formatted Markdown
- Sync notes via Chrome Account Sync or GitHub Gists
- Import and export notes as JSON
- Export individual notes as Markdown, plain text, or JSON
- Switch between dark and light themes

SideNotes does not include advertising, analytics, user accounts, or a remote notes service.

### Category

Productivity

### Language

English

---

## Privacy practices

### Single purpose

SideNotes provides a Chrome side-panel workspace for creating, organizing, and locally storing notes, including page links and text that the user explicitly chooses to save while browsing.

### Permission justifications for version 1.1.2

#### `sidePanel`

Required to display the note-taking interface in Chrome's native side panel when the user opens SideNotes.

#### `storage`

Required to store the user's notes, titles, categories, tags, pinned status, active-note selection, and theme preference locally in `chrome.storage.local` / `chrome.storage.sync`.

#### `contextMenus`

Required to provide user-initiated right-click commands for adding highlighted website text to the active note or creating a new note from that selection.

#### `tabs`

Required to read the title and URL of the currently active tab when the user chooses **Clip Page** or **Insert Page Link**.

#### `activeTab`

Grants temporary access to the active tab upon explicit user interaction (such as clicking the extension context menu or action shortcut).

#### `scripting`

Required to read user-highlighted text when the user explicitly triggers a web clipping action.

### Host permissions

**NONE** (Zero broad host permissions requested).

### Remote code

Select:

> No, I am not using remote code.

All executable JavaScript and styling are bundled locally inside the extension package.

---

## Contact

For privacy questions about SideNotes, contact: **warlette.dev@gmail.com**
