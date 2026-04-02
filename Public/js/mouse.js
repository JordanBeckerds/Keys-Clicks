/* =============================================
   KEYS & CLICK — Mouse Aim Test
   ============================================= */

const MouseTest = (() => {

  let state = {
    running:    false,
    finished:   false,
    hits:       0,
    misses:     0,
    duration:   30,
    timeLeft:   30,
    targetSize: 50,    // px diameter
    minDelay:   1500,  // ms before target moves (speed val)
    timer:      null,
    targetTimer:null,
    startTime:  null,
    currentTarget: null,
  };

  const $arena    = () => document.getElementById('mouseArena');
  const $hint     = () => document.getElementById('arenaHint');
  const $hits     = () => document.getElementById('mouseHits');
  const $acc      = () => document.getElementById('mouseAcc');
  const $timerEl  = () => document.getElementById('mouseTimer');
  const $resetBtn = () => document.getElementById('mouseReset');

  function calcAcc() {
    const total = state.hits + state.misses;
    if (total === 0) return 0;
    return Math.round((state.hits / total) * 100);
  }

  function updateStats() {
    $hits().textContent    = state.hits;
    $acc().textContent     = calcAcc() + '%';
    $timerEl().textContent = state.timeLeft + 's';
  }

  // ── Target management ────────────────────────
  function getRandomPosition(size) {
    const arena = $arena();
    const rect  = arena.getBoundingClientRect();
    const pad   = size / 2 + 6;
    const x = pad + Math.random() * (rect.width  - pad * 2);
    const y = pad + Math.random() * (rect.height - pad * 2);
    return { x, y };
  }

  function removeCurrentTarget() {
    if (state.currentTarget && state.currentTarget.parentNode) {
      state.currentTarget.classList.remove('visible');
      // Remove after transition
      const el = state.currentTarget;
      setTimeout(() => el.remove(), 150);
    }
    state.currentTarget = null;
    clearTimeout(state.targetTimer);
  }

  function spawnTarget() {
    if (!state.running) return;
    removeCurrentTarget();

    const size = state.targetSize;
    const pos  = getRandomPosition(size);

    const target = document.createElement('div');
    target.className = 'aim-target';
    target.style.cssText = `
      left: ${pos.x}px;
      top: ${pos.y}px;
      width: ${size}px;
      height: ${size}px;
    `;

    target.addEventListener('click',      e => { e.stopPropagation(); onHit(e); });
    target.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); onHit(e); }, { passive: false });

    $arena().appendChild(target);
    state.currentTarget = target;

    // Trigger appear animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => target.classList.add('visible'));
    });

    // Auto-move after delay (speed penalty = miss)
    state.targetTimer = setTimeout(() => {
      if (state.running) {
        state.misses++;
        updateStats();
        spawnTarget();
      }
    }, state.minDelay);
  }

  function onHit(e) {
    if (!state.running) return;
    state.hits++;
    updateStats();

    // Hit flash at click position
    const arena = $arena();
    const rect  = arena.getBoundingClientRect();
    let cx, cy;
    if (e.touches && e.touches.length > 0) {
      cx = e.touches[0].clientX - rect.left;
      cy = e.touches[0].clientY - rect.top;
    } else {
      cx = e.clientX - rect.left;
      cy = e.clientY - rect.top;
    }

    const flash = document.createElement('div');
    flash.className = 'hit-flash';
    flash.style.cssText = `left:${cx}px; top:${cy}px; width:${state.targetSize}px; height:${state.targetSize}px;`;
    arena.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove());

    clearTimeout(state.targetTimer);
    spawnTarget();
  }

  function onMiss(e) {
    if (!state.running) return;
    // Only count miss if click wasn't on target
    const arena = $arena();
    const rect  = arena.getBoundingClientRect();
    let cx, cy;
    if (e.touches && e.touches.length > 0) {
      cx = e.touches[0].clientX - rect.left;
      cy = e.touches[0].clientY - rect.top;
    } else {
      cx = e.clientX - rect.left;
      cy = e.clientY - rect.top;
    }

    state.misses++;
    updateStats();

    // Miss dot
    const dot = document.createElement('div');
    dot.className = 'miss-dot';
    dot.style.cssText = `left:${cx}px; top:${cy}px;`;
    arena.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  }

  // ── Timer ────────────────────────────────────
  function tick() {
    state.timeLeft--;
    $timerEl().textContent = state.timeLeft + 's';
    if (state.timeLeft <= 0) finish();
  }

  // ── Start ────────────────────────────────────
  function start() {
    if (state.running) return;
    state.running  = true;
    state.finished = false;
    state.hits     = 0;
    state.misses   = 0;
    state.timeLeft = state.duration;
    state.startTime= Date.now();

    $hint().style.display = 'none';
    updateStats();

    state.timer = setInterval(tick, 1000);
    spawnTarget();
  }

  function finish() {
    if (!state.running) return;
    state.running  = false;
    state.finished = true;
    clearInterval(state.timer);
    clearTimeout(state.targetTimer);
    state.timer = null;

    removeCurrentTarget();
    $hint().style.display = '';

    const acc = calcAcc();
    const rating = getAimRating(acc);

    window.showResults('mouse', [
      { val: state.hits,    lbl: i18n.t('resHits'), highlight: true },
      { val: acc + '%',     lbl: i18n.t('resACC') },
      { val: state.misses,  lbl: 'Misses' },
      { val: state.duration + 's', lbl: i18n.t('resTime') },
      { val: rating,        lbl: i18n.t('ratingLabel') },
    ]);
  }

  function getAimRating(acc) {
    if (acc < 40)  return i18n.t('ratingBeginner');
    if (acc < 55)  return i18n.t('ratingAverage');
    if (acc < 70)  return i18n.t('ratingGood');
    if (acc < 82)  return i18n.t('ratingGreat');
    if (acc < 92)  return i18n.t('ratingExcellent');
    return i18n.t('ratingProdigy');
  }

  // ── Reset ────────────────────────────────────
  function reset() {
    clearInterval(state.timer);
    clearTimeout(state.targetTimer);
    state.timer    = null;
    state.running  = false;
    state.finished = false;
    state.hits     = 0;
    state.misses   = 0;
    state.timeLeft = state.duration;
    state.startTime= null;

    removeCurrentTarget();

    // Clear all lingering effects
    const arena = $arena();
    arena.querySelectorAll('.aim-target, .hit-flash, .miss-dot').forEach(el => el.remove());

    $hint().style.display  = '';
    $hint().textContent    = i18n.t('clickToStart');
    $hits().textContent    = '0';
    $acc().textContent     = '0%';
    $timerEl().textContent = state.duration + 's';
  }

  // ── Init ─────────────────────────────────────
  function init() {
    // Speed pills
    document.getElementById('mouseSpeed').addEventListener('click', e => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      document.querySelectorAll('#mouseSpeed .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.minDelay = parseInt(pill.dataset.value);
    });

    // Size pills
    document.getElementById('mouseSize').addEventListener('click', e => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      document.querySelectorAll('#mouseSize .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.targetSize = parseInt(pill.dataset.value);
    });

    // Duration pills
    document.getElementById('mouseDuration').addEventListener('click', e => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      document.querySelectorAll('#mouseDuration .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.duration = parseInt(pill.dataset.value);
      if (!state.running) {
        state.timeLeft = state.duration;
        $timerEl().textContent = state.duration + 's';
      }
    });

    // Arena click — start or miss
    const arena = $arena();

    arena.addEventListener('click', e => {
      if (!state.running && !state.finished) {
        start();
        return;
      }
      if (state.running && e.target === arena) {
        onMiss(e);
      }
    });

    arena.addEventListener('touchstart', e => {
      e.preventDefault();
      if (!state.running && !state.finished) {
        start();
        return;
      }
      if (state.running && e.target === arena) {
        onMiss(e);
      }
    }, { passive: false });

    $resetBtn().addEventListener('click', reset);

    window.addEventListener('langchange', () => {
      if (!state.running) {
        $hint().textContent = i18n.t('clickToStart');
      }
    });
  }

  function retryLast() { reset(); start(); }

  return { init, reset, retryLast };
})();
