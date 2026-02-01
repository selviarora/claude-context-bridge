// Claude Context Bridge - Content Script
// Injects "Send to Claude Code" button into Claude.ai

(function() {
  'use strict';

  console.log('[CCB] Claude Context Bridge content script loaded');

  let buttonInjected = false;

  // SVG Icons
  const icons = {
    export: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>`,
    terminal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="4 17 10 11 4 5"/>
      <line x1="12" y1="19" x2="20" y2="19"/>
    </svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`,
    x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`
  };

  function extractConversation() {
    const messages = [];

    // Claude.ai conversation structure - look for message containers
    const messageElements = document.querySelectorAll('[data-testid="conversation-turn"]');

    if (messageElements.length > 0) {
      messageElements.forEach(el => {
        const role = el.querySelector('[data-testid="user-message"]') ? 'user' : 'assistant';
        const content = el.innerText.trim();
        if (content) {
          messages.push({ role, content });
        }
      });
    } else {
      // Fallback: try to find message pairs by common patterns
      const allMessages = document.querySelectorAll('.prose, [class*="message"]');
      allMessages.forEach(el => {
        const content = el.innerText.trim();
        if (content && content.length > 10) {
          messages.push({ role: 'unknown', content });
        }
      });
    }

    // If still nothing, get the main conversation container
    if (messages.length === 0) {
      const mainContent = document.querySelector('main, [role="main"], .conversation');
      if (mainContent) {
        return mainContent.innerText;
      }
    }

    return messages;
  }

  function formatConversation(messages) {
    if (typeof messages === 'string') {
      return messages;
    }

    return messages.map(msg => {
      const role = msg.role === 'user' ? '## User' :
                   msg.role === 'assistant' ? '## Assistant' : '## Message';
      return `${role}\n\n${msg.content}`;
    }).join('\n\n---\n\n');
  }

  function getConversationTitle() {
    // Try to get title from page
    const titleEl = document.querySelector('title');
    const title = titleEl ? titleEl.innerText.replace(' - Claude', '').trim() : '';

    // Or from first user message
    const firstMessage = document.querySelector('[data-testid="user-message"]');
    const firstText = firstMessage ? firstMessage.innerText.slice(0, 50) : '';

    return title || firstText || 'conversation';
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
  }

  function showModal() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'ccb-modal-overlay';
    overlay.innerHTML = `
      <div id="ccb-modal">
        <h2>
          ${icons.terminal}
          Send to Claude Code
        </h2>
        <label for="ccb-context-name">Context name</label>
        <input type="text" id="ccb-context-name" placeholder="my-project-plan" />
        <div id="ccb-buttons">
          <button id="ccb-cancel">Cancel</button>
          <button id="ccb-send">Send</button>
        </div>
        <div id="ccb-status"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = document.getElementById('ccb-context-name');
    const suggestedName = slugify(getConversationTitle());
    input.value = suggestedName;
    input.select();

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.getElementById('ccb-cancel').onclick = () => overlay.remove();

    document.getElementById('ccb-send').onclick = async () => {
      const name = input.value.trim() || 'context';
      const filename = slugify(name) + '.md';
      const status = document.getElementById('ccb-status');

      status.className = 'ccb-visible';
      status.textContent = 'Extracting conversation...';

      const messages = extractConversation();
      const content = formatConversation(messages);

      if (!content || content.length < 50) {
        status.className = 'ccb-visible ccb-error';
        status.textContent = 'Could not extract conversation. Try refreshing the page.';
        return;
      }

      const header = `# Context: ${name}\n` +
                     `Exported from Claude.ai on ${new Date().toISOString().split('T')[0]}\n\n---\n\n`;

      status.textContent = 'Sending to Claude Code...';

      try {
        // Send to background script for native messaging
        chrome.runtime.sendMessage({
          action: 'saveContext',
          filename: filename,
          content: header + content
        }, response => {
          if (response && response.success) {
            status.className = 'ccb-visible ccb-success';
            status.innerHTML = `${icons.check} Saved! Use <strong>load context ${name}</strong> in Claude Code`;
            setTimeout(() => overlay.remove(), 2500);
          } else {
            status.className = 'ccb-visible ccb-error';
            status.textContent = response?.error || 'Failed to save. Is the native host installed?';
          }
        });
      } catch (err) {
        status.className = 'ccb-visible ccb-error';
        status.textContent = err.message;
      }
    };

    // Enter key submits, Escape closes
    input.onkeydown = (e) => {
      if (e.key === 'Enter') document.getElementById('ccb-send').click();
      if (e.key === 'Escape') overlay.remove();
    };
  }

  function injectButton() {
    if (buttonInjected) return;

    const button = document.createElement('button');
    button.id = 'ccb-export-button';
    button.innerHTML = `${icons.export}<span class="ccb-button-text">Send to Claude Code</span>`;
    button.onclick = showModal;
    button.title = 'Export this conversation to Claude Code';

    document.body.appendChild(button);
    buttonInjected = true;
    console.log('[CCB] Button injected');
  }

  // Wait for page to load, then inject
  function init() {
    // Check if we're on a conversation page
    if (window.location.pathname.includes('/chat/')) {
      setTimeout(injectButton, 1000);
    }
  }

  // Run on load and on navigation (SPA)
  init();

  // Watch for SPA navigation
  let lastPath = window.location.pathname;
  setInterval(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      buttonInjected = false;
      // Remove old button if exists
      const oldButton = document.getElementById('ccb-export-button');
      if (oldButton) oldButton.remove();
      init();
    }
  }, 500);
})();
