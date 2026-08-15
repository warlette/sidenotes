# SideNotes — Chrome Web Store Submission & Justification Guide

**Version**: `1.1.2`  
**Support Email**: `warlette.dev@gmail.com`

---

## 📋 Copy & Paste Store Justifications

### 1. `scripting` Permission Justification
```text
The `scripting` permission is used strictly on-demand when the user explicitly clicks the "Clip Page" button inside the SideNotes side panel or triggers a context menu action. It executes a lightweight inline function to read the user's highlighted text selection and page meta description from the active tab so it can be saved into their note. No background monitoring or automated script injections are performed.
```

---

### 2. Host Permissions Justification
```text
SideNotes requests NO broad host permissions (`<all_urls>` has been completely omitted). Active tab access is granted strictly on-demand using the `activeTab` permission only when the user explicitly initiates a web clip or context menu action.
```

---

### 3. Complete Permissions Reference Table

| Permission | Chrome Web Store Justification Text |
|------------|-----------------------------------|
| **`sidePanel`** | Required to display the note-taking workspace inside Google Chrome's native Side Panel UI. |
| **`storage`** | Required to save user notes, categories, tags, pinned status, and theme preferences locally in `chrome.storage.local` / `chrome.storage.sync`. |
| **`contextMenus`** | Required to add user-initiated right-click options ("Add selection to active note", "Create new note from selection") when text is highlighted on web pages. |
| **`tabs`** | Required to retrieve the title and URL of the active tab when the user clicks "Clip Page" or uses context menu shortcuts. |
| **`activeTab`** | Grants temporary, secure access to the active tab upon explicit user interaction (e.g. clicking context menu commands or shortcut actions). |
| **`scripting`** | Required to read user-highlighted text selection and page description metadata from the active tab when explicitly triggered by the user. |

---

## 🔒 Privacy & Data Disclosures

- **Single Purpose Statement**: SideNotes provides a split-browser side panel workspace for taking Markdown notes, organizing thoughts, and saving web clips alongside active browsing sessions.
- **Data Collection**: None. SideNotes collects zero personal data, browsing history, or analytics.
- **Remote Code**: Select **"No, I am not using remote code"** (all JS and CSS are bundled locally inside the package).
