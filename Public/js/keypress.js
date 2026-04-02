/* =============================================
   KEYS & CLICK — Key Press / Reaction Test
   ============================================= */

const KeyTest = (() => {

  // Keys to test (A-Z + digits)
  const KEY_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
  // Subset for mobile (easier to render as buttons)
  const MOBILE_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  let state = {
    running:   false,
    finished:  false,
    current:   null,
    correct:   0,
    wrong:     0,
    total:     0,
    duration:  60,
    timeLeft:  60,
    timer:     null,
    history:   [],
  };

  const $char     = () => document.getElementById('keyChar');
  const $target   = () => document.getElementById('keyTarget');
  const $feedback = () => document.getElementById('keyFeedback');
  const $count    = () => document.getElementById('keyCount');
  const $acc      = () => document.getElementById('keyAcc');
  const $timer    = () => document.getElementById('keyTimer');
  const $history  = () => document.getElementById('keyHistory');
  const $startBtn = () => document.getElementById('keyStart');
  const $resetBtn = () => document.getElementById('keyReset');
  const $keypad   = () => document.getElementById('mobileKeypad');

  function randomKey() {
    return KEY_SET[Math.floor(Math.random() * KEY_SET.length)];
  }

  function setTarget(k) {
    state.current = k;
    $char().textContent = k;

    // Highlight target key on mobile pad
    document.querySelectorAll('.key-pad-btn').forEach(btn => {
      btn.classList.toggle('target-key', btn.dataset.key === k);
    });
  }

  function calcAcc() {
    if (state.total === 0) return 0;
    return Math.round((state.correct / state.total) * 100);
  }

  function updateStats() {
    $count().textContent = state.correct;
    $acc().textContent   = calcAcc() + '%';
    $timer().textContent = state.timeLeft + 's';
  }

  function addHistory(key, ok) {
    state.history.unshift({ key, ok });
    if (state.history.length > 20) state.history.pop();

    const chip = document.createElement('span');
    chip.className = `history-chip ${ok ? 'ok' : 'miss'}`;
    chip.textContent = key;

    const hist = $history();
    hist.insertBefore(chip, hist.firstChild);

    // Keep DOM clean
    while (hist.children.length > 20) hist.removeChild(hist.lastChild);
  }

  function showFeedback(ok) {
    const el = $feedback();
    el.className = `key-feedback ${ok ? 'ok' : 'miss'}`;
    el.textContent = ok ? '✓' : '✗';
    setTimeout(() => { el.textContent = ''; el.className = 'key-feedback'; }, 400);
  }

  function flashTarget(ok) {
    const el = $target();
    el.classList.add(ok ? 'hit' : 'miss');
    setTimeout(() => el.classList.remove('hit', 'miss'), 200);
  }

  function handleKey(key) {
    if (!state.running) return;
    const k = key.toUpperCase();
    if (!KEY_SET.includes(k)) return;

    state.total++;
    const ok = k === state.current;
    if (ok) { state.correct++; } else { state.wrong++; }

    addHistory(k, ok);
    showFeedback(ok);
    flashTarget(ok);
    updateStats();

    // Always move to next key (even on wrong press)
    setTarget(randomKey());
  }

  function tick() {
    state.timeLeft--;
    $timer().textContent = state.timeLeft + 's';
    if (state.timeLeft <= 0) finish();
  }

  function finish() {
    if (!state.running) return;
    state.running  = false;
    state.finished = true;
    clearInterval(state.timer);
    state.timer = null;

    $startBtn().disabled = false;
    document.querySelectorAll('.key-pad-btn').forEach(b => b.classList.remove('target-key'));

    const acc = calcAcc();
    const rating = getKeyRating(state.correct);

    window.showResults('keypress', [
      { val: state.correct, lbl: i18n.t('resKeys'), highlight: true },
      { val: acc + '%',     lbl: i18n.t('resACC') },
      { val: state.wrong,   lbl: 'Misses' },
      { val: state.duration + 's', lbl: i18n.t('resTime') },
      { val: rating,        lbl: i18n.t('ratingLabel') },
    ]);
  }

  function getKeyRating(correct) {
    const perSec = correct / state.duration;
    if (perSec < 1)   return i18n.t('ratingBeginner');
    if (perSec < 2)   return i18n.t('ratingAverage');
    if (perSec < 3)   return i18n.t('ratingGood');
    if (perSec < 4)   return i18n.t('ratingGreat');
    if (perSec < 5.5) return i18n.t('ratingExcellent');
    return i18n.t('ratingProdigy');
  }

  function start() {
    if (state.running) return;
    state.running  = true;
    state.finished = false;
    state.correct  = 0;
    state.wrong    = 0;
    state.total    = 0;
    state.history  = [];
    state.timeLeft = state.duration;

    $history().innerHTML = '';
    $feedback().textContent = '';
    $feedback().className   = 'key-feedback';
    $startBtn().disabled    = true;

    setTarget(randomKey());
    updateStats();
    state.timer = setInterval(tick, 1000);
  }

  function reset() {
    clearInterval(state.timer);
    state.timer    = null;
    state.running  = false;
    state.finished = false;
    state.correct  = 0;
    state.wrong    = 0;
    state.total    = 0;
    state.history  = [];
    state.timeLeft = state.duration;
    state.current  = null;

    $char().textContent     = '—';
    $count().textContent    = '0';
    $acc().textContent      = '0%';
    $timer().textContent    = state.duration + 's';
    $history().innerHTML    = '';
    $feedback().textContent = '';
    $feedback().className   = 'key-feedback';
    $startBtn().disabled    = false;

    document.querySelectorAll('.key-pad-btn').forEach(b => b.classList.remove('target-key'));
  }

  function buildMobilePad() {
    const pad = $keypad();
    pad.innerHTML = '';
    MOBILE_KEYS.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'key-pad-btn';
      btn.dataset.key = k;
      btn.textContent = k;
      btn.setAttribute('aria-label', `Key ${k}`);
      // Prevent focus stealing
      btn.addEventListener('mousedown', e => e.preventDefault());
      btn.addEventListener('click', () => handleKey(k));
      btn.addEventListener('touchstart', e => {
        e.preventDefault();
        handleKey(k);
      }, { passive: false });
      pad.appendChild(btn);
    });
  }

  function init() {
    buildMobilePad();

    // Duration pills
    document.getElementById('keyDuration').addEventListener('click', e => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      document.querySelectorAll('#keyDuration .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.duration = parseInt(pill.dataset.value);
      if (!state.running) {
        state.timeLeft = state.duration;
        $timer().textContent = state.duration + 's';
      }
    });

    $startBtn().addEventListener('click', start);
    $resetBtn().addEventListener('click', reset);

    // Physical keyboard
    document.addEventListener('keydown', e => {
      if (!state.running) return;
      // Ignore modifier-heavy combos
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1) {
        e.preventDefault();
        handleKey(e.key);
      }
    });
  }

  function retryLast() { reset(); start(); }

  return { init, reset, retryLast };
})();
