function processNode(root = document) {
  // 1. Traverse and inject styles/hiding logic into any open shadow roots
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      return node.shadowRoot ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });

  if (root.shadowRoot) {
    injectIntoShadow(root.shadowRoot);
    processNode(root.shadowRoot);
  }

  while (walker.nextNode()) {
    const host = walker.currentNode;
    injectIntoShadow(host.shadowRoot);
    processNode(host.shadowRoot);
  }

  // 2. Hide "For You" and click "Following" in the current scope
  const elements = root.querySelectorAll('a, button, [role="tab"], shreddit-tab, slot');

  elements.forEach((el) => {
    const text = (el.textContent || el.innerText || '').trim().toLowerCase();

    // Hide "For You" tab, slot, or container
    if (text === 'for you' || el.id === 'feed-tab-1' || el.getAttribute('slot') === 'page-1') {
      const target = el.closest('li') || el.assignedSlot || el.parentElement || el;
      target.style.setProperty('display', 'none', 'important');
      target.style.setProperty('width', '0', 'important');
      target.style.setProperty('min-width', '0', 'important');
      target.style.setProperty('margin', '0', 'important');
      target.style.setProperty('padding', '0', 'important');
    }

    // Auto-select "Following" tab
    if (text === 'following') {
      const isSelected = el.getAttribute('aria-selected') === 'true' || el.classList.contains('active');
      if (!isSelected && !el.dataset.autoClicked) {
        el.dataset.autoClicked = 'true';
        el.click();
      }
    }
  });
}

// Helper to inject CSS directly inside Reddit's shadow components
function injectIntoShadow(shadowRoot) {
  if (!shadowRoot || shadowRoot._redditFixApplied) return;
  
  const style = document.createElement('style');
  style.textContent = `
    #feed-tab-1, 
    [slot="page-1"],
    button[id*="tab-1"] {
      display: none !important;
      width: 0 !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  `;
  shadowRoot.appendChild(style);
  shadowRoot._redditFixApplied = true;
}

// Run immediately and observe DOM/SPA changes
processNode();

const observer = new MutationObserver(() => {
  processNode();
});

if (document.body || document.documentElement) {
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });
}