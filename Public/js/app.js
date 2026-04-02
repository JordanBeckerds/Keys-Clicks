/* =============================================
   KEYS & CLICK — App Orchestrator
   ============================================= */

(function () {

  // ── Modules map ─────────────────────────────
  const modules = {
    typing:   TypingTest,
    cps:      CPSTest,
    keypress: KeyTest,
    mouse:    MouseTest,
  };

  // ── Last test for retry ──────────────────────
  let lastTest = null;

  // ── Tab switching ───────────────────────────
  function initTabs() {
    const tabs   = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.test-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;

        // Reset currently active test when switching
        const activePanel = document.querySelector('.test-panel.active');
        if (activePanel) {
          const activeId = activePanel.id.replace('panel-', '');
          if (modules[activeId] && typeof modules[activeId].reset === 'function') {
            modules[activeId].reset();
          }
        }

        // Update tabs
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // Update panels
        panels.forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(`panel-${target}`);
        if (panel) panel.classList.add('active');

        // Close any open modal
        hideModal();
      });
    });
  }

  // ── Results Modal ───────────────────────────
  window.showResults = function (testId, results) {
    lastTest = testId;

    const modal = document.getElementById('resultsModal');
    const body  = document.getElementById('resultsBody');
    body.innerHTML = '';

    results.forEach(item => {
      const div = document.createElement('div');
      div.className = 'result-item' + (item.highlight ? ' highlight' : '');

      const val = document.createElement('span');
      val.className = 'result-val';
      val.textContent = item.val;

      const lbl = document.createElement('span');
      lbl.className = 'result-lbl';
      lbl.textContent = item.lbl;

      div.appendChild(val);
      div.appendChild(lbl);
      body.appendChild(div);
    });

    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    // Focus the modal for accessibility
    setTimeout(() => {
      const firstFocusable = modal.querySelector('button');
      if (firstFocusable) firstFocusable.focus();
    }, 50);
  };

  function hideModal() {
    const modal = document.getElementById('resultsModal');
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  function initModal() {
    document.getElementById('modalClose').addEventListener('click',  hideModal);
    document.getElementById('modalClose2').addEventListener('click', hideModal);

    document.getElementById('modalRetry').addEventListener('click', () => {
      hideModal();
      if (lastTest && modules[lastTest]) {
        modules[lastTest].retryLast();
      }
    });

    // Click outside modal closes it
    document.getElementById('resultsModal').addEventListener('click', e => {
      if (e.target === e.currentTarget) hideModal();
    });

    // Escape key closes it
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('resultsModal');
        if (!modal.hidden) {
          e.preventDefault();
          hideModal();
        }
      }
    });
  }

  // ── Init ─────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initModal();

    // Init all test modules
    Object.values(modules).forEach(mod => {
      if (typeof mod.init === 'function') mod.init();
    });
  });

})();
