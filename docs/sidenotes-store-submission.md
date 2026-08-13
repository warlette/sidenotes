# SideNotes — Chrome Web Store submission content

Prepared and verified from the `sidenotes.zip` package (version 1.0.1).

## Status: Ready for Submission (v1.0.1)

All pre-submission corrections have been applied and verified:

- [x] **Unused `scripting` permission removed** from `manifest.json`.
- [x] **Unused `activeTab` permission removed** from `manifest.json`.
- [x] **Unused `<all_urls>` host permission removed** from `manifest.json`.
- [x] **Unused `content.js` script removed**.
- [x] **External Google Fonts `<link>` tags removed** — font stacks now use high-quality native system fonts (`-apple-system`, `BlinkMacSystemFont`, `SFMono-Regular`, etc.) for 100% offline security compliance.
- [x] **Version bumped to `1.0.1`** and `sidenotes.zip` rebuilt and verified.

The **Clip Page** button captures the active page title and URL. Selected text is captured through the two right-click context-menu commands. The listing below describes this exact behavior.

---

## Store listing

### Name

SideNotes — Side Panel Notes

### Summary (maximum 132 characters)

Take Markdown notes in Chrome's side panel, clip page links and selected text, and keep everything stored locally.

### Detailed description

SideNotes gives you a focused note-taking workspace in Chrome's native side panel, so you can write and organize notes without leaving the page you are viewing.

Create Markdown-formatted notes, save links to useful pages, or highlight text on a website and add it to a note from Chrome's right-click menu. Notes are stored locally in your Chrome profile and are not synced to a SideNotes server.

Features:

- Write notes beside the page you are viewing
- Format notes with headings, emphasis, lists, checklists, quotations, code blocks, and links
- Save the active page's title and URL into a note
- Add highlighted website text to an existing note or create a new note from it
- Organize notes with categories, tags, pinned items, and search
- Preview formatted Markdown
- Import and export notes as JSON
- Export individual notes as Markdown, plain text, or JSON
- Switch between dark and light themes
- Store notes locally with `chrome.storage.local`

SideNotes does not include advertising, analytics, user accounts, or a remote notes service.

### Category

Productivity

### Language

English

---

## Privacy practices

### Single purpose

SideNotes provides a Chrome side-panel workspace for creating, organizing, and locally storing notes, including page links and text that the user explicitly chooses to save while browsing.

### Permission justifications for version 1.0.1

#### `sidePanel`

Required to display the note-taking interface in Chrome's native side panel when the user opens SideNotes.

#### `storage`

Required to store the user's notes, titles, categories, tags, pinned status, active-note selection, and theme preference locally in `chrome.storage.local`.

#### `contextMenus`

Required to provide user-initiated right-click commands for adding highlighted website text to the active note or creating a new note from that selection.

#### `tabs`

Required to read the title and URL of the currently active tab only when the user chooses **Clip Page** or **Insert Page Link**. SideNotes does not monitor or build a history of tabs in the background.

### Remote code

Select:

> No, I am not using remote code.

All executable JavaScript and styling are bundled locally inside the extension package.

### Data types handled

Select the following categories if the dashboard asks what user data the extension handles, even though it remains on the user's device:

- **Web history** — the title and URL of the active page are accessed only when the user explicitly clips or inserts that page.
- **Website content** — highlighted website text is accessed only when the user explicitly invokes a SideNotes context-menu command.

Do not select personally identifiable information, health information, financial information, authentication information, location, or user-activity monitoring. SideNotes does not intentionally access those categories.

User-written note content, tags, categories, and preferences are stored locally. If the form provides a separate **User-generated content** category, select it and explain that it is stored only in `chrome.storage.local`.

### Data-use certifications

Confirm all of the following:

- Data is used only to provide the note-taking and user-requested clipping features.
- Data is not sold to third parties.
- Data is not used or transferred for advertising, profiling, creditworthiness, or purposes unrelated to SideNotes' single purpose.
- Notes, page links, and selected website text are not transmitted to the developer or a SideNotes server.
- Humans do not read user data through SideNotes.

---

## Privacy policy draft

### SideNotes Privacy Policy

**Effective date:** August 14, 2026

SideNotes is a Chrome extension for creating and organizing notes in Chrome's side panel. This policy explains the information SideNotes handles and how it is used.

#### Information handled by SideNotes

SideNotes handles:

- Notes, note titles, categories, tags, and pinned status created by the user
- The title and URL of the active page when the user explicitly chooses to clip or insert that page
- Website text that the user explicitly selects and sends to SideNotes through a right-click command
- Theme and active-note preferences
- JSON files that the user explicitly chooses to import

#### How information is used

This information is used only to provide SideNotes' note-taking, organization, search, import, export, and user-requested web-clipping features.

#### Storage and transmission

Notes and preferences are stored locally in the user's Chrome profile using `chrome.storage.local`. SideNotes does not operate a remote notes server and does not transmit notes, saved page links, selected website text, or imported files to the developer.

SideNotes does not use analytics, advertising trackers, or user accounts.

#### Sharing and selling

SideNotes does not sell, rent, or share user data with third parties. It does not use user data for advertising, profiling, creditworthiness, or any purpose unrelated to its note-taking functionality.

#### User control and deletion

Users can edit or delete individual notes within SideNotes. Removing the extension and its locally stored data through Chrome removes the information stored by SideNotes. Users may export notes before removal if they want to retain a backup.

#### Limited Use

SideNotes' use of information received from Chrome APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.

#### Changes

If SideNotes' data-handling practices change, this policy and the Chrome Web Store disclosures will be updated before the changed practices are introduced.

#### Contact

For privacy questions about SideNotes, contact: **warlette.montoya@gmail.com**

---

## Required graphic assets

- Existing store icon: `icons/icon-128.png`
- At least one screenshot showing the real extension UI at **1280×800** or **640×400**
- Small promotional tile at **440×280**
- Optional marquee promotional image at **1400×560**

---

## Recommended distribution for the first review

Use **Unlisted** if you want anyone with the listing URL to install it while you validate the first release. Use **Public** only when the listing assets, support contact, privacy-policy URL, and package are ready. Both choices are reviewed under the same policies.
