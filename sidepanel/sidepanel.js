// SideNotes Side Panel Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // App State
  let notes = [];
  let activeNoteId = null;
  let saveDebounceTimer = null;
  let isPinnedOnlyFilter = false;
  let currentCategoryFilter = 'ALL';
  let searchQuery = '';
  let isEditingMode = true;

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

  // Initialize
  initApp();

  async function initApp() {
    await loadThemePreference();
    await loadNotesFromStorage();
    setupEventListeners();
    setupRuntimeListeners();
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
    const data = await chrome.storage.local.get(['sidenotes_list', 'sidenotes_active_id']);
    notes = data.sidenotes_list || [];
    activeNoteId = data.sidenotes_active_id || null;

    if (notes.length === 0) {
      // Create initial welcome note if empty
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

    await chrome.storage.local.set({
      sidenotes_list: notes,
      sidenotes_active_id: activeNoteId
    });

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

  // --- Initial Welcome Note ---
  function createWelcomeNote() {
    const timestamp = new Date().toISOString();
    return {
      id: 'note_welcome',
      title: '✨ Welcome to SideNotes (Impeccable Edition)',
      content: `# Welcome to SideNotes 👑\n\n*Styled with the Impeccable Kin-paku Design System*\n\n### Core Features:\n- 📝 **Markdown Workspace**: Headers, **bold**, *italic*, blockquotes, and \`code snippets\`.\n- 🌐 **Instant Web Capture**: Click **"Clip Page"** or use right-click context menu on any webpage to grab links & selections.\n- 🏷️ **Categories & Search**: Organize your thoughts with custom tags and real-time search.\n- 💾 **100% Offline & Private**: All notes stay strictly on your local browser via \`chrome.storage.local\`.\n\nTry creating a new note using the **"+ New"** button above!`,
      category: 'General',
      tags: ['welcome', 'impeccable'],
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
        // Append to current note
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
    // Clean redundant consecutive uls
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
