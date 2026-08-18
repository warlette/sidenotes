# SideNotes v1 — Critical Fixes + Release Recommendation Prompt

You are working on the Chrome extension **SideNotes - Split View Note Taking**.

Repository/project context:
- Chrome Manifest V3 extension
- Native `chrome.sidePanel`
- Local note-taking with Markdown
- Web clipping from the active page
- Context-menu capture for selected text
- Categories, tags, search, pinning
- Import/export
- Dark/light mode
- Existing Chrome storage sync option
- Existing GitHub Gist sync option using a user-provided PAT
- Current version around `1.1.2`

Primary files to inspect first:
- `manifest.json`
- `service-worker.js`
- `sidepanel/sidepanel.js`
- `sidepanel/sidepanel.html`
- `sidepanel/sidepanel.css`
- `privacy.html`
- `CHROMEWEBSTORE.md`
- `README.md`

---

## Objective

Prepare SideNotes for a **safe, reliable, publishable v1 release**.

Do **not** add AI, payments, subscriptions, analytics, accounts, or a custom backend in this task.

The goal is to fix the most important technical and policy issues first, simplify risky features if necessary, and ship a clean free v1 that can start acquiring users.

---

# Priority 0 — Audit Before Editing

Before changing code:

1. Inspect the full repository.
2. Confirm the actual current behavior of:
   - local storage
   - Chrome Sync
   - GitHub Gist sync
   - web clipping
   - selected-text capture
   - import/export
   - privacy disclosures
   - requested permissions
3. Identify any mismatch between:
   - actual implementation
   - `manifest.json`
   - `privacy.html`
   - `CHROMEWEBSTORE.md`
   - `README.md`
4. Create a short implementation checklist before modifying files.

Do not assume documentation is accurate. Treat the code as the source of truth.

---

# Priority 1 — Make Local Storage the Canonical v1 Storage

For v1, **local storage must be the default and most reliable storage mode**.

Use:

```js
chrome.storage.local
```

as the canonical note database.

Requirements:

- Notes must work fully offline.
- Creating, editing, deleting, searching, pinning, categorizing, importing, and exporting must not require internet access.
- No user should lose notes because a sync API quota was exceeded.
- Saving must be resilient to malformed or missing stored data.
- Preserve existing notes during upgrades.
- Add defensive error handling around storage reads/writes.
- Do not silently overwrite valid data with empty arrays.

---

# Priority 2 — Fix Chrome Sync Design

The current design may store the entire notes array in one `chrome.storage.sync` item.

Do **not** use Chrome Sync as the primary database for arbitrary-length Markdown notes.

For v1, choose one of the following approaches, preferring the safest and simplest:

## Preferred v1 approach

Use `chrome.storage.sync` only for small preferences such as:

- theme
- active category/filter preference
- UI preferences
- optionally small configuration values

Keep note contents in `chrome.storage.local`.

If the current UI advertises full note sync through Chrome Sync, remove or relabel that capability for v1.

## Alternative

If you retain note synchronization using Chrome Sync, redesign it so:

- notes are not stored as one giant object
- quota limits are explicitly handled
- oversized notes fail gracefully
- users receive a clear message
- data is never silently lost

However, prefer removing full-note Chrome Sync from v1 rather than introducing unnecessary complexity.

---

# Priority 3 — Decide What to Do With GitHub Gist Sync

GitHub Gist sync is useful for technical users, but it is not suitable as the main consumer sync experience.

For v1, implement one of these:

## Recommended

Keep GitHub Gist sync as an **optional Advanced / Experimental feature**.

Requirements:

- Clearly label it as optional.
- Explain that it requires the user's own GitHub Personal Access Token.
- Never expose or log the PAT.
- Never include the PAT in exports.
- Store credentials only if explicitly necessary.
- Add a "Disconnect" / "Remove token" action.
- Clear stored token and Gist ID when disconnecting.
- Never transmit notes to GitHub unless the user explicitly enables and uses Gist sync.
- Handle expired, revoked, or invalid tokens gracefully.
- Handle network failures without affecting local notes.
- Keep local data canonical; Gist sync must never destroy local notes after a failed request.

If cross-origin GitHub API calls require host permission, update the manifest using the **narrowest possible permission**.

Prefer optional host permissions if practical.

Do not request broad host permissions such as `<all_urls>`.

---

# Priority 4 — Fix Privacy Policy and Documentation

The current documentation must accurately reflect actual behavior.

Audit and update:

- `privacy.html`
- `CHROMEWEBSTORE.md`
- `README.md`

The privacy policy must no longer make claims such as:

- "zero data transmission"
- "no external endpoints"

if GitHub Gist sync remains available.

Use precise language.

Recommended disclosure model:

> SideNotes stores notes locally by default. If the user explicitly enables GitHub Gist sync, selected SideNotes data is transmitted to GitHub using credentials provided by the user for the purpose of synchronization and backup.

Also clarify:

- what data is stored locally
- what data may be transmitted
- when transmission occurs
- that web-page title/URL/selected text is only accessed when the user explicitly invokes a clipping action
- whether any analytics exist
- whether data is sold or used for advertising
- how users can delete notes and credentials
- what uninstalling the extension removes

Make all disclosures consistent across files.

---

# Priority 5 — Permission Minimization

Audit `manifest.json`.

For each permission, verify it is truly required:

- `sidePanel`
- `storage`
- `contextMenus`
- `tabs`
- `activeTab`
- `scripting`

Remove permissions that are unnecessary.

Prefer:
- `activeTab`
- user-triggered access
- narrowly scoped permissions

Avoid:
- broad host permissions
- `<all_urls>`
- permissions used only for convenience

If `tabs` can be removed while retaining the necessary user-triggered behavior, remove it.

Document each retained permission in `CHROMEWEBSTORE.md`.

---

# Priority 6 — Protect User Notes From Data Loss

Add defensive handling for:

- corrupted local storage
- failed writes
- invalid imported JSON
- missing properties in older note versions
- duplicate IDs
- invalid dates
- malformed tags/categories
- failed sync operations

Requirements:

- Never delete the user's current local data because remote sync fails.
- Before replacing a large local dataset during import, validate the file.
- Prefer merge or explicit replace flows.
- If replace is supported, require an explicit confirmation.
- Automatically create a local backup before destructive import/restore operations when practical.
- Keep IDs stable.
- Normalize older note shapes during load.

Create a small migration/normalization function, for example:

```js
normalizeNote(note)
```

and use it when loading/importing notes.

---

# Priority 7 — Improve Import / Export Reliability

For v1:

### Export
Support:
- current note → Markdown
- current note → Text
- full backup → JSON

The full JSON backup should include a small version field, for example:

```json
{
  "schemaVersion": 1,
  "exportedAt": "...",
  "notes": []
}
```

Do not export secrets such as:
- GitHub PAT
- authentication tokens

### Import
Validate:
- JSON structure
- schema version
- notes array
- required fields

Provide a clear error when invalid.

Do not crash the side panel because of malformed input.

---

# Priority 8 — Web Clipping Safety and UX

Review:

- active-tab clipping
- page-title capture
- URL capture
- selected-text capture
- context menus

Requirements:

- Only capture data after an explicit user action.
- Do not monitor browsing history.
- Do not automatically scrape pages in the background.
- Do not persist more page information than required.
- Clearly indicate the source URL when a clip is inserted.
- Handle restricted Chrome pages gracefully.
- Handle pages where script injection is not allowed without breaking the extension.

---

# Priority 9 — Remove Misleading v1 Claims

Audit all marketing text.

Do not advertise features that are not reliable.

For v1, the recommended positioning is:

> **Your research notebook beside every webpage.**

Recommended short positioning:

> Take Markdown notes, save useful web snippets, and organize research without leaving the page you're reading.

Avoid positioning SideNotes as:
- a full Notion replacement
- an Evernote replacement
- an AI research assistant
- enterprise collaboration software
- guaranteed cross-device cloud storage

until those capabilities actually exist.

---

# Recommended v1 Feature Set

Ship v1 with the following.

## Core — Free

### Note taking
- unlimited local notes within browser/device storage limits
- Markdown editor
- Markdown preview
- autosave
- note title
- categories
- tags
- pinning
- search

### Browsing workflow
- Chrome Side Panel
- clip current page title + URL
- capture user-selected text
- context-menu capture
- insert current-page link

### Data portability
- export note as Markdown
- export note as text
- export complete JSON backup
- import JSON backup

### UX
- dark mode
- light mode
- keyboard shortcuts
- empty states
- clear save status
- helpful error states

### Privacy
- local-first by default
- no advertising
- no tracking for v1
- no background browsing surveillance

### Optional advanced feature
- GitHub Gist manual sync / backup
- clearly marked Advanced or Experimental

---

# Features NOT to Build for v1

Do not implement these yet:

- AI summarization
- AI chat
- embeddings/vector database
- subscriptions
- Stripe
- PayMongo
- user accounts
- custom cloud backend
- sharing
- collaboration
- teams
- browser history tracking
- analytics SDKs
- ads
- affiliate links
- automatic background page scraping
- complex rich-text editor
- mobile application

These are post-v1 features.

---

# Recommended Post-v1 Roadmap

After v1 has real users:

## v1.1
- bug fixes from Web Store feedback
- better keyboard shortcuts
- better clipping
- note templates
- custom categories
- improved backup/restore

## v1.5
Build a real SideNotes cloud backend.

Suggested capabilities:
- email / Google authentication
- encrypted or privacy-conscious cloud note storage
- automatic cross-device sync
- device management
- sync conflict handling
- server-side backups
- note version history

This becomes the foundation for paid plans.

## v2 — SideNotes Pro
Potential paid features:
- cloud sync
- automatic backup
- note version history
- advanced web clipping
- templates
- saved searches
- smart collections

Possible initial pricing:

- `$2.99/month`
- `$24/year`

Do not implement payment until the free product has actual usage.

## v3
Consider AI only after users demonstrate demand.

Potential AI features:
- summarize current page
- summarize selected text
- extract action items
- convert article into structured notes
- ask questions about saved notes
- rewrite/clean notes

AI should be a paid service because it creates recurring infrastructure cost.

---

# Code Quality Requirements

While implementing the v1 fixes:

- Keep Manifest V3 compatibility.
- Avoid unnecessary libraries.
- Avoid introducing a framework unless there is a strong technical reason.
- Keep code easy to audit.
- Extract repeated storage/sync logic into small functions.
- Add meaningful error handling.
- Remove dead code.
- Remove stale comments.
- Avoid console logging secrets or full user note contents.
- Preserve backward compatibility with existing locally stored notes.

Suggested internal modules/functions if appropriate:

```txt
storage
  loadNotes()
  saveNotes()
  normalizeNote()
  createBackup()
  importBackup()

gistSync
  connect()
  disconnect()
  push()
  pull()
  validateConfig()

permissions
  requestGitHubPermission()
  removeGitHubPermission()
```

Do not over-engineer the codebase simply to match this suggested structure.

---

# Testing Checklist

Manually test at minimum:

## Installation
- fresh install
- upgrade from current version

## Notes
- create
- edit
- autosave
- rename
- pin/unpin
- delete
- large Markdown note

## Organization
- tags
- categories
- search
- filtering

## Clipping
- regular page
- selected text
- right-click action
- restricted Chrome page
- page with no selected text

## Storage
- browser restart
- extension reload
- Chrome update/reload simulation
- corrupted/missing storage data

## Backup
- Markdown export
- text export
- JSON export
- valid JSON import
- invalid JSON import
- old-format import

## Gist
If retained:
- no token
- invalid token
- revoked token
- first push
- repeated push
- pull
- network offline
- conflicting local/remote notes
- disconnect

## Privacy
Verify no request is sent to GitHub unless the user explicitly uses Gist sync.

---

# Chrome Web Store Release Checklist

Before calling the task complete:

1. `manifest.json` permissions are minimal and correct.
2. Version is updated appropriately.
3. Extension loads with no console errors.
4. Core local note features work offline.
5. Privacy policy matches implementation.
6. Chrome Web Store description matches implementation.
7. Permissions justifications are accurate.
8. No secrets are included in the repository/package.
9. No development-only files are accidentally included in the release ZIP.
10. No oversized screenshots/assets unnecessarily inflate the package.
11. Package the exact production extension files.
12. Update `README.md` with current installation/features.
13. Update `CHROMEWEBSTORE.md`.
14. Update `privacy.html`.
15. Create a concise changelog for the release.

---

# Final Deliverables

When finished, provide:

1. Summary of problems found.
2. Exact files changed.
3. Explanation of each important change.
4. Any permissions added or removed.
5. Any feature removed or downgraded for v1 and why.
6. Privacy/documentation changes.
7. Storage and sync architecture after the changes.
8. Manual test results.
9. Remaining known limitations.
10. Recommendation on whether this build is ready for Chrome Web Store submission.

Do not claim the extension is ready unless the release checklist is actually satisfied.

---

# Product Decision Guideline

When choosing between:

- a sophisticated implementation that delays release, and
- a simpler, safer implementation that preserves user data,

choose the simpler, safer implementation for v1.

The primary success metric for v1 is:

> **Users can install SideNotes, immediately take useful notes beside webpages, safely keep their data, clip research, and trust the extension.**

Do not optimize v1 for monetization yet.

Optimize v1 for:
1. trust
2. reliability
3. useful daily workflow
4. Chrome Web Store approval
5. early user adoption
