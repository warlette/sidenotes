// SideNotes Side Panel Application Logic — Version 1.1.0 with Multi-Device Sync

document.addEventListener('DOMContentLoaded', () => {
  // App State
  let notes = [];
  let activeNoteId = null;
  let saveDebounceTimer = null;
  let isPinnedOnlyFilter = false;
  let currentCategoryFilter = 'ALL';
  let searchQuery = '';
  let isEditingMode = true;

  // Sync & Storage Settings State
  let storageMode = 'local'; // 'local' or 'sync'
  let gistPat = '';
  let gistId = '';
  let lastGistSync = '';

  // DOM Element References
  const notesListEl = document.getElementById('notes-list');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const categoryFilter = document.getElementById('category-filter');
  const pinnedFilterBtn = document.getElementById('pinned-filter-btn');
  const toggleListBtn = document.getElementById('toggle-list-btn');
  const notesDrawer = document.getElementById('notes-drawer');

  const titleInput = document.getElementById('note-title-input');
  const pinNoteBtn = document.getElementById('pin-note-btn');
  const categorySelect = document.getElementById('note-category-select');
  const tagsInput = document.getElementById('note-tags-input');
  const editorTextarea = document.getElementById('note-editor');
  const previewDiv = document.getElementById('note-preview');

  const editModeBtn = document.getElementById('edit-mode-btn');
  const previewModeBtn = document.getElementById('preview-mode-btn');

  const wordCountEl = document.getElementById('word-count');
  const charCountEl = document.getElementById('char-count');
  const saveStatusEl = document.getElementById('save-status');

  const quickClipBtn = document.getElementById('quick-clip-btn');
  const newNoteBtn = document.getElementById('new-note-btn');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const insertActiveLinkBtn = document.getElementById('insert-active-link-btn');

  const copyNoteBtn = document.getElementById('copy-note-btn');
  const deleteNoteBtn = document.getElementById('delete-note-btn');
  const exportDropdownBtn = document.getElementById('export-dropdown-btn');
  const exportMenu = document.getElementById('export-menu');
  const exportMDBtn = document.getElementById('export-md-btn');
  const exportTxtBtn = document.getElementById('export-txt-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');

  const importBtn = document.getElementById('import-btn');
  const exportAllBtn = document.getElementById('export-all-btn');
  const importFileInput = document.getElementById('import-file-input');

  // Settings Modal Elements
  const settingsOpenBtn = document.getElementById('settings-open-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsCloseBtn = document.getElementById('settings-close-btn');
  const settingsSaveBtn = document.getElementById('settings-save-btn');
  const gistPatInput = document.getElementById('gist-pat-input');
  const gistIdInput = document.getElementById('gist-id-input');
  const gistPushBtn = document.getElementById('gist-push-btn');
  const gistPullBtn = document.getElementById('gist-pull-btn');
  const gistSyncStatus = document.getElementById('gist-sync-status');

  // Initialize
  initApp();

  async function initApp() {
    await loadSettings();
    await loadThemePreference();
    await loadNotesFromStorage();
    setupEventListeners();
    setupRuntimeListeners();
  }

  // --- Storage Driver Abstraction ---
  function getStorageArea() {
    return storageMode === 'sync' && chrome.storage.sync ? chrome.storage.sync : chrome.storage.local;
  }

  async function loadSettings() {
    const data = await chrome.storage.local.get(['sidenotes_storage_mode', 'sidenotes_gist_pat', 'sidenotes_gist_id', 'sidenotes_last_sync']);
    storageMode = data.sidenotes_storage_mode || 'local';
    gistPat = data.sidenotes_gist_pat || '';
    gistId = data.sidenotes_gist_id || '';
    lastGistSync = data.sidenotes_last_sync || '';

    // Populate modal controls
    const radio = document.querySelector(`input[name="storage-mode"][value="${storageMode}"]`);
    if (radio) radio.checked = true;
    gistPatInput.value = gistPat;
    gistIdInput.value = gistId;
    updateGistStatusUI();
  }

  async function saveSettingsFromModal() {
    const selectedRadio = document.querySelector('input[name="storage-mode"]:checked');
    const newStorageMode = selectedRadio ? selectedRadio.value : 'local';
    gistPat = gistPatInput.value.trim();
    gistId = gistIdInput.value.trim();

    await chrome.storage.local.set({
      sidenotes_storage_mode: newStorageMode,
      sidenotes_gist_pat: gistPat,
      sidenotes_gist_id: gistId
    });

    if (newStorageMode !== storageMode) {
      storageMode = newStorageMode;
      // Re-save notes to new driver
      await saveNotesToStorage();
      showToast(`Switched storage mode to ${storageMode.toUpperCase()}`);
    } else {
      showToast('Settings saved');
    }

    settingsModal.classList.add('hidden');
  }

  function updateGistStatusUI() {
    if (lastGistSync) {
      const dateStr = new Date(lastGistSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      gistSyncStatus.textContent = `Status: Last synced at ${dateStr}`;
      gistSyncStatus.style.borderColor = 'var(--accent-border)';
    } else if (gistPat) {
      gistSyncStatus.textContent = 'Status: Token configured (ready to sync)';
    } else {
      gistSyncStatus.textContent = 'Status: Not connected';
    }
  }

  // --- Theme Management ---
  async function loadThemePreference() {
    const { sidenotes_theme = 'dark' } = await chrome.storage.local.get('sidenotes_theme');
    document.documentElement.setAttribute('data-theme', sidenotes_theme);
  }

  async function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    await chrome.storage.local.set({ sidenotes_theme: newTheme });
    showToast(`Switched to ${newTheme} mode`);
  }

  // --- Storage & Data Loading ---
  async function loadNotesFromStorage() {
    const driver = getStorageArea();
    let data = await driver.get(['sidenotes_list', 'sidenotes_active_id']);
    
    // Fallback check in local if sync was empty
    if ((!data.sidenotes_list || data.sidenotes_list.length === 0) && storageMode === 'sync') {
      data = await chrome.storage.local.get(['sidenotes_list', 'sidenotes_active_id']);
    }

    notes = data.sidenotes_list || [];
    activeNoteId = data.sidenotes_active_id || null;

    if (notes.length === 0) {
      const welcomeNote = createWelcomeNote();
      notes = [welcomeNote];
      activeNoteId = welcomeNote.id;
      await saveNotesToStorage();
    } else if (!notes.some((n) => n.id === activeNoteId)) {
      activeNoteId = notes[0].id;
    }

    renderNotesList();
    loadActiveNoteIntoEditor();
  }

  async function saveNotesToStorage() {
    saveStatusEl.textContent = 'Saving...';
    saveStatusEl.className = 'save-status saving';

    const driver = getStorageArea();
    await driver.set({
      sidenotes_list: notes,
      sidenotes_active_id: activeNoteId
    });

    // Also mirror to local as a safety backup
    if (storageMode === 'sync') {
      await chrome.storage.local.set({
        sidenotes_list: notes,
        sidenotes_active_id: activeNoteId
      });
    }

    setTimeout(() => {
      saveStatusEl.textContent = 'Saved';
      saveStatusEl.className = 'save-status';
    }, 400);
  }

  function triggerAutoSave() {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveStatusEl.textContent = 'Unsaved changes';
    saveStatusEl.className = 'save-status saving';

    saveDebounceTimer = setTimeout(async () => {
      syncCurrentEditorToMemory();
      await saveNotesToStorage();
      renderNotesList();
    }, 500);
  }

  // --- GitHub Gist Cloud Sync Client ---
  async function pushToGitHubGist() {
    const token = gistPatInput.value.trim() || gistPat;
    if (!token) {
      showToast('Please enter a GitHub Personal Access Token first');
      return;
    }

    syncCurrentEditorToMemory();
    gistSyncStatus.textContent = 'Status: Pushing notes to GitHub Gist...';

    const payload = {
      description: 'SideNotes Chrome Extension Backup',
      public: false,
      files: {
        'sidenotes_backup.json': {
          content: JSON.stringify(notes, null, 2)
        }
      }
    };

    try {
      let url = 'https://api.github.com/gists';
      let method = 'POST';

      if (gistId) {
        url += `/${gistId}`;
        method = 'PATCH';
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      gistId = result.id;
      gistIdInput.value = gistId;
      lastGistSync = new Date().toISOString();

      await chrome.storage.local.set({
        sidenotes_gist_pat: token,
        sidenotes_gist_id: gistId,
        sidenotes_last_sync: lastGistSync
      });

      updateGistStatusUI();
      showToast('Successfully pushed notes to GitHub Gist! 🎉');
    } catch (err) {
      console.error('Gist push error:', err);
      gistSyncStatus.textContent = `Error: ${err.message}`;
      showToast('Gist Push Failed');
    }
  }

  async function pullFromGitHubGist() {
    const token = gistPatInput.value.trim() || gistPat;
    const currentGistId = gistIdInput.value.trim() || gistId;

    if (!token || !currentGistId) {
      showToast('Please enter both Token and Gist ID to pull');
      return;
    }

    gistSyncStatus.textContent = 'Status: Pulling notes from GitHub Gist...';

    try {
      const response = await fetch(`https://api.github.com/gists/${currentGistId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const backupFile = result.files && result.files['sidenotes_backup.json'];

      if (!backupFile || !backupFile.content) {
        throw new Error('sidenotes_backup.json not found in Gist');
      }

      const remoteNotes = JSON.parse(backupFile.content);
      if (!Array.isArray(remoteNotes)) {
        throw new Error('Invalid notes data in Gist');
      }

      // Merge remote notes with local notes (by id and latest updatedAt)
      const noteMap = new Map();
      notes.forEach((n) => noteMap.set(n.id, n));

      let addedOrUpdated = 0;
      remoteNotes.forEach((rn) => {
        const local = noteMap.get(rn.id);
        if (!local || new Date(rn.updatedAt) > new Date(local.updatedAt)) {
          noteMap.set(rn.id, rn);
          addedOrUpdated++;
        }
      });

      notes = Array.from(noteMap.values());
      if (notes.length > 0 && !notes.some((n) => n.id === activeNoteId)) {
        activeNoteId = notes[0].id;
      }

      lastGistSync = new Date().toISOString();
      await chrome.storage.local.set({
        sidenotes_gist_pat: token,
        sidenotes_gist_id: currentGistId,
        sidenotes_last_sync: lastGistSync
      });

      await saveNotesToStorage();
      renderNotesList();
      loadActiveNoteIntoEditor();
      updateGistStatusUI();

      showToast(`Pulled & merged ${addedOrUpdated} note(s) from Gist!`);
    } catch (err) {
      console.error('Gist pull error:', err);
      gistSyncStatus.textContent = `Error: ${err.message}`;
      showToast('Gist Pull Failed');
    }
  }

  // --- Initial Welcome Note ---
  function createWelcomeNote() {
    const timestamp = new Date().toISOString();
    return {
      id: 'note_welcome',
      title: '✨ Welcome to SideNotes (Impeccable Edition)',
      content: `# Welcome to SideNotes 👑\n\n*Styled with the Impeccable Kin-paku Design System*\n\n### Core Features:\n- 📝 **Markdown Workspace**: Headers, **bold**, *italic*, blockquotes, and \`code snippets\`.\n- 🌐 **Instant Web Capture**: Click **"Clip Page"** or use right-click context menu on any webpage to grab links & selections.\n- 🔄 **Multi-Device Sync**: Sync notes natively via **Chrome Account Sync** or **GitHub Gists**.\n- 🏷️ **Categories & Search**: Organize your thoughts with custom tags and real-time search.\n- 💾 **Local & Private**: All notes stay strictly on your browser or private cloud sync.\n\nTry creating a new note using the **"+ New"** button above!`,
      category: 'General',
      tags: ['welcome', 'impeccable', 'sync'],
      pinned: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  // --- Editor & Memory Sync ---
  function syncCurrentEditorToMemory() {
    if (!activeNoteId) return;
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;

    note.title = titleInput.value.trim() || 'Untitled Note';
    note.content = editorTextarea.value;
    note.category = categorySelect.value;
    note.tags = tagsInput.value.split(',').map((t) => t.trim()).filter(Boolean);
    note.updatedAt = new Date().toISOString();
  }

  function loadActiveNoteIntoEditor() {
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) {
      clearEditor();
      return;
    }

    titleInput.value = note.title || '';
    categorySelect.value = note.category || 'General';
    tagsInput.value = (note.tags || []).join(', ');
    editorTextarea.value = note.content || '';

    updatePinButtonUI(note.pinned);
    updateStats();
    if (!isEditingMode) {
      renderMarkdownPreview();
    }
  }

  function clearEditor() {
    titleInput.value = '';
    categorySelect.value = 'General';
    tagsInput.value = '';
    editorTextarea.value = '';
    wordCountEl.textContent = '0 words';
    charCountEl.textContent = '0 chars';
  }

  function updatePinButtonUI(isPinned) {
    if (isPinned) {
      pinNoteBtn.classList.add('active');
    } else {
      pinNoteBtn.classList.remove('active');
    }
  }

  function updateStats() {
    const text = editorTextarea.value || '';
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    wordCountEl.textContent = `${words} word${words === 1 ? '' : 's'}`;
    charCountEl.textContent = `${chars} char${chars === 1 ? '' : 's'}`;
  }

  // --- Render Notes List ---
  function renderNotesList() {
    notesListEl.innerHTML = '';

    const filtered = notes.filter((note) => {
      if (isPinnedOnlyFilter && !note.pinned) return false;
      if (currentCategoryFilter !== 'ALL' && note.category !== currentCategoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = (note.title || '').toLowerCase().includes(q);
        const inContent = (note.content || '').toLowerCase().includes(q);
        const inTags = (note.tags || []).some((t) => t.toLowerCase().includes(q));
        return inTitle || inContent || inTags;
      }
      return true;
    });

    // Sort: Pinned first, then by updatedAt desc
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    if (filtered.length === 0) {
      notesListEl.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 11px;">No notes found</div>`;
      return;
    }

    filtered.forEach((note) => {
      const card = document.createElement('div');
      card.className = `note-card ${note.id === activeNoteId ? 'active' : ''}`;
      
      const snippet = note.content ? note.content.replace(/[#*`>]/g, '').trim() : 'Empty note';
      const dateFormatted = new Date(note.updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });

      card.innerHTML = `
        <div class="note-card-header">
          <span class="note-card-title">${escapeHtml(note.title || 'Untitled')}</span>
          ${note.pinned ? '<span class="star-indicator">★</span>' : ''}
        </div>
        <div class="note-card-snippet">${escapeHtml(snippet)}</div>
        <div class="note-card-footer">
          <span class="badge-cat">${escapeHtml(note.category || 'General')}</span>
          <span>${dateFormatted}</span>
        </div>
      `;

      card.addEventListener('click', async () => {
        syncCurrentEditorToMemory();
        activeNoteId = note.id;
        renderNotesList();
        loadActiveNoteIntoEditor();
        await saveNotesToStorage();
      });

      notesListEl.appendChild(card);
    });
  }

  // --- CRUD Operations ---
  async function createNewNote(title = 'New Note', content = '', category = 'General', tags = []) {
    syncCurrentEditorToMemory();
    const timestamp = new Date().toISOString();
    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: title,
      content: content,
      category: category,
      tags: tags,
      pinned: false,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    notes.unshift(newNote);
    activeNoteId = newNote.id;

    renderNotesList();
    loadActiveNoteIntoEditor();
    await saveNotesToStorage();

    titleInput.focus();
    showToast('New note created');
  }

  async function deleteActiveNote() {
    if (!activeNoteId) return;
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;

    if (!confirm(`Are you sure you want to delete "${note.title}"?`)) return;

    notes = notes.filter((n) => n.id !== activeNoteId);
    activeNoteId = notes.length > 0 ? notes[0].id : null;

    if (!activeNoteId) {
      const fresh = createWelcomeNote();
      notes = [fresh];
      activeNoteId = fresh.id;
    }

    renderNotesList();
    loadActiveNoteIntoEditor();
    await saveNotesToStorage();
    showToast('Note deleted');
  }

  async function togglePinNote() {
    if (!activeNoteId) return;
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;

    note.pinned = !note.pinned;
    updatePinButtonUI(note.pinned);
    renderNotesList();
    await saveNotesToStorage();
    showToast(note.pinned ? 'Note pinned' : 'Note unpinned');
  }

  // --- Active Tab Web Capture ---
  async function captureActivePageContext(createAsNewNote = false) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showToast('Unable to query active tab');
        return;
      }

      const contextData = {
        title: tab.title || 'Web Page',
        url: tab.url || ''
      };

      const dateStr = new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const snippetMarkdown = `### [${contextData.title}](${contextData.url})\n\n*Captured on ${dateStr}*\n`;

      if (createAsNewNote || !activeNoteId) {
        await createNewNote(
          contextData.title.length > 40 ? contextData.title.substring(0, 40) + '...' : contextData.title,
          snippetMarkdown,
          'Web Snippets',
          ['web-clip']
        );
      } else {
        editorTextarea.value += (editorTextarea.value ? '\n\n' : '') + snippetMarkdown;
        triggerAutoSave();
        updateStats();
        showToast('Page context added to active note');
      }
    } catch (err) {
      console.error('Error capturing page:', err);
      showToast('Could not capture page context');
    }
  }

  // --- Markdown Formatting Toolbar Action Handler ---
  function applyFormatting(action) {
    const start = editorTextarea.selectionStart;
    const end = editorTextarea.selectionEnd;
    const text = editorTextarea.value;
    const selected = text.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (action) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`;
        cursorOffset = selected ? replacement.length : 2;
        break;
      case 'italic':
        replacement = `*${selected || 'italic text'}*`;
        cursorOffset = selected ? replacement.length : 1;
        break;
      case 'strike':
        replacement = `~~${selected || 'strikethrough'}~~`;
        cursorOffset = selected ? replacement.length : 2;
        break;
      case 'h1':
        replacement = `# ${selected || 'Heading 1'}`;
        cursorOffset = replacement.length;
        break;
      case 'h2':
        replacement = `## ${selected || 'Heading 2'}`;
        cursorOffset = replacement.length;
        break;
      case 'h3':
        replacement = `### ${selected || 'Heading 3'}`;
        cursorOffset = replacement.length;
        break;
      case 'ul':
        replacement = selected
          ? selected.split('\n').map((line) => `- ${line}`).join('\n')
          : '- List item';
        cursorOffset = replacement.length;
        break;
      case 'checklist':
        replacement = selected
          ? selected.split('\n').map((line) => `- [ ] ${line}`).join('\n')
          : '- [ ] Task item';
        cursorOffset = replacement.length;
        break;
      case 'quote':
        replacement = selected
          ? selected.split('\n').map((line) => `> ${line}`).join('\n')
          : '> Blockquote';
        cursorOffset = replacement.length;
        break;
      case 'code':
        replacement = `\`\`\`javascript\n${selected || '// code here'}\n\`\`\``;
        cursorOffset = selected ? replacement.length : 17;
        break;
      case 'link':
        replacement = `[${selected || 'Link Title'}](https://example.com)`;
        cursorOffset = selected ? replacement.length - 1 : 1;
        break;
    }

    editorTextarea.value = text.substring(0, start) + replacement + text.substring(end);
    editorTextarea.focus();
    editorTextarea.setSelectionRange(start + cursorOffset, start + cursorOffset);

    triggerAutoSave();
    updateStats();
  }

  // --- Markdown Preview Parser ---
  function renderMarkdownPreview() {
    const raw = editorTextarea.value || '';
    let html = escapeHtml(raw);

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    // Blockquotes
    html = html.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');
    // Checklists
    html = html.replace(/^- \[ \] (.*$)/gim, '<div><input type="checkbox" disabled> $1</div>');
    html = html.replace(/^- \[x\] (.*$)/gim, '<div><input type="checkbox" checked disabled> $1</div>');
    // Bullet lists
    html = html.replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    // Bold / Italic / Strike
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // Line breaks
    html = html.replace(/\n/g, '<br>');

    previewDiv.innerHTML = html;
  }

  // --- Import / Export ---
  function exportActiveNote(format) {
    if (!activeNoteId) return;
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;

    let content = '';
    let filename = `${sanitizeFilename(note.title || 'note')}`;
    let mimeType = 'text/plain';

    if (format === 'md') {
      content = `# ${note.title}\n\n${note.content}`;
      filename += '.md';
      mimeType = 'text/markdown';
    } else if (format === 'txt') {
      content = `${note.title}\n${'='.repeat(note.title.length)}\n\n${note.content.replace(/[#*`]/g, '')}`;
      filename += '.txt';
      mimeType = 'text/plain';
    } else if (format === 'json') {
      content = JSON.stringify(note, null, 2);
      filename += '.json';
      mimeType = 'application/json';
    }

    downloadBlob(content, filename, mimeType);
    showToast(`Exported as ${format.toUpperCase()}`);
  }

  function exportAllNotesJSON() {
    const content = JSON.stringify(notes, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadBlob(content, `sidenotes_backup_${dateStr}.json`, 'application/json');
    showToast('Exported all notes');
  }

  function importNotesJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        const importedList = Array.isArray(imported) ? imported : [imported];

        let addedCount = 0;
        importedList.forEach((item) => {
          if (item.content) {
            notes.unshift({
              id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              title: item.title || 'Imported Note',
              content: item.content || '',
              category: item.category || 'General',
              tags: item.tags || [],
              pinned: Boolean(item.pinned),
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            addedCount++;
          }
        });

        if (addedCount > 0) {
          activeNoteId = notes[0].id;
          renderNotesList();
          loadActiveNoteIntoEditor();
          await saveNotesToStorage();
          showToast(`Imported ${addedCount} note(s)`);
        } else {
          showToast('No valid notes found in file');
        }
      } catch (err) {
        showToast('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  // --- Runtime Messaging Listener ---
  function setupRuntimeListeners() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'NOTE_CREATED_VIA_CONTEXT_MENU' || message.type === 'NOTE_UPDATED_VIA_CONTEXT_MENU') {
        loadNotesFromStorage();
        showToast('Note updated from browser selection');
      }
    });
  }

  // --- Event Listeners Wiring ---
  function setupEventListeners() {
    // Top Bar Actions
    quickClipBtn.addEventListener('click', () => captureActivePageContext(true));
    newNoteBtn.addEventListener('click', () => createNewNote());
    themeToggleBtn.addEventListener('click', toggleTheme);
    toggleListBtn.addEventListener('click', () => notesDrawer.classList.toggle('collapsed'));

    // Settings Modal Events
    settingsOpenBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    settingsCloseBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    settingsSaveBtn.addEventListener('click', saveSettingsFromModal);
    gistPushBtn.addEventListener('click', pushToGitHubGist);
    gistPullBtn.addEventListener('click', pullFromGitHubGist);

    // Drawer Filter / Search
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      clearSearchBtn.classList.toggle('hidden', !searchQuery);
      renderNotesList();
    });
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      renderNotesList();
    });
    categoryFilter.addEventListener('change', (e) => {
      currentCategoryFilter = e.target.value;
      renderNotesList();
    });
    pinnedFilterBtn.addEventListener('click', () => {
      isPinnedOnlyFilter = !isPinnedOnlyFilter;
      pinnedFilterBtn.classList.toggle('active', isPinnedOnlyFilter);
      renderNotesList();
    });

    // Editor Input Auto-save
    titleInput.addEventListener('input', triggerAutoSave);
    categorySelect.addEventListener('change', triggerAutoSave);
    tagsInput.addEventListener('input', triggerAutoSave);
    editorTextarea.addEventListener('input', () => {
      updateStats();
      triggerAutoSave();
    });

    pinNoteBtn.addEventListener('click', togglePinNote);

    // Toolbar formatting buttons
    document.querySelectorAll('.tb-btn[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyFormatting(btn.getAttribute('data-action'));
      });
    });

    insertActiveLinkBtn.addEventListener('click', () => captureActivePageContext(false));

    // Mode Toggle
    editModeBtn.addEventListener('click', () => {
      isEditingMode = true;
      editModeBtn.classList.add('active');
      previewModeBtn.classList.remove('active');
      editorTextarea.classList.remove('hidden');
      previewDiv.classList.add('hidden');
    });

    previewModeBtn.addEventListener('click', () => {
      isEditingMode = false;
      previewModeBtn.classList.add('active');
      editModeBtn.classList.remove('active');
      editorTextarea.classList.add('hidden');
      previewDiv.classList.remove('hidden');
      renderMarkdownPreview();
    });

    // Footer Actions
    copyNoteBtn.addEventListener('click', () => {
      if (editorTextarea.value) {
        navigator.clipboard.writeText(editorTextarea.value);
        showToast('Copied to clipboard');
      }
    });

    deleteNoteBtn.addEventListener('click', deleteActiveNote);

    exportDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => exportMenu.classList.add('hidden'));

    exportMDBtn.addEventListener('click', () => exportActiveNote('md'));
    exportTxtBtn.addEventListener('click', () => exportActiveNote('txt'));
    exportJsonBtn.addEventListener('click', () => exportActiveNote('json'));

    importBtn.addEventListener('click', () => importFileInput.click());
    exportAllBtn.addEventListener('click', exportAllNotesJSON);
    importFileInput.addEventListener('change', importNotesJSON);

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Alt+N: New Note
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNewNote();
      }
      // Alt+S: Toggle Drawer
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        notesDrawer.classList.toggle('collapsed');
      }
      // Ctrl+S / Cmd+S: Manual Save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        syncCurrentEditorToMemory();
        saveNotesToStorage();
        showToast('Saved');
      }
    });
  }

  // --- Utility Functions ---
  function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function sanitizeFilename(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
  }

  function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});
