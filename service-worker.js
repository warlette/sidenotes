// SideNotes Background Service Worker

// Enable opening side panel when extension action icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting panel behavior:', error));

// Register Context Menu items on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'add-selection-to-sidenotes',
    title: '📌 Add selection to active note',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'create-note-from-selection',
    title: '✨ Create new note from selection',
    contexts: ['selection']
  });

  console.log('SideNotes service worker initialized.');
});

// Handle Context Menu item clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.selectionText || !tab) return;

  const selectionText = info.selectionText.trim();
  const pageTitle = tab.title || 'Web Snippet';
  const pageUrl = tab.url || '';

  const timestamp = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (info.menuItemId === 'create-note-from-selection') {
    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: pageTitle.length > 40 ? pageTitle.substring(0, 40) + '...' : pageTitle,
      content: `### [${pageTitle}](${pageUrl})\n\n> ${selectionText}\n\n*Captured on ${dateStr}*\n`,
      category: 'Web Snippets',
      tags: ['web-clip'],
      pinned: false,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const data = await chrome.storage.local.get(['sidenotes_list', 'sidenotes_active_id']);
    const notesList = data.sidenotes_list || [];
    notesList.unshift(newNote);

    await chrome.storage.local.set({
      sidenotes_list: notesList,
      sidenotes_active_id: newNote.id
    });

    // Notify sidepanel runtime if open
    chrome.runtime.sendMessage({ type: 'NOTE_CREATED_VIA_CONTEXT_MENU', note: newNote }).catch(() => {});
  } else if (info.menuItemId === 'add-selection-to-sidenotes') {
    const data = await chrome.storage.local.get(['sidenotes_list', 'sidenotes_active_id']);
    let notesList = data.sidenotes_list || [];
    let activeId = data.sidenotes_active_id;

    let activeNote = notesList.find((n) => n.id === activeId);

    const snippetText = `\n\n> ${selectionText}\n*Source: [${pageTitle}](${pageUrl})*\n`;

    if (activeNote) {
      activeNote.content += snippetText;
      activeNote.updatedAt = timestamp;
    } else {
      activeNote = {
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        title: 'Captured Snippets',
        content: `### Quick Snippets\n` + snippetText,
        category: 'Web Snippets',
        tags: ['web-clip'],
        pinned: false,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      notesList.unshift(activeNote);
      activeId = activeNote.id;
    }

    await chrome.storage.local.set({
      sidenotes_list: notesList,
      sidenotes_active_id: activeId
    });

    // Notify sidepanel runtime if open
    chrome.runtime.sendMessage({ type: 'NOTE_UPDATED_VIA_CONTEXT_MENU', note: activeNote }).catch(() => {});
  }

  // Attempt to open side panel to show user the newly added note
  try {
    if (tab.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  } catch (err) {
    // Ignore error if sidePanel.open is restricted by window state
  }
});
