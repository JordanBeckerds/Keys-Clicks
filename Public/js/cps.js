/* =============================================
   KEYS & CLICK — CPS Test
   ============================================= */

const CPSTest = (() => {

  let state = {
    running:    false,
    finished:   false,
    clicks:     0,
    duration:   10,
    timeLeft:   10,
    timer:      null,
    startTime:  null,
    peakCPS:    0,
  };

  const $zone     = () => document.getElementById('cpsZone');
  const $bigNum   = () => document.getElementById('cpsBigNum');
  const $hint     = () => document.getElementById('cpsHint');
  const $current  = () => document.getElementById('cpsCurrent');
  const $clicks   = () => document.getElementById('cpsClicks');
  const $timer    = () => document.getElementById('cpsTimer');
  const $ripples  = () => document.getElementById('cpsRipples');
  const $reset    = () => document.getElementById('cpsReset');

  function getCPS() {
    if (!state.startTime) return 0;
    const elapsed = (Date.now() - state.startTime) / 1000;
    if (elapsed <= 0) return 0;
    return state.clicks / elapsed;
  }

  function updateStats() {
    const cps = getCPS();
    const cpsStr = cps.toFixed(2);
    $bigNum().textContent  = cpsStr;
    $current().textContent = cpsStr;
    $clicks().textContent  = state.clicks;
    $timer().textContent   = state.timeLeft + 's';
    if (cps > state.peakCPS) state.peakCPS = cps;
  }

  function spawnRipple(e) {
    const zone = $zone();
    const rect = zone.getBoundingClientRect();
    let x, y;

    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e.clientX || rect.width / 2) - rect.left;
      y = (e.clientY || rect.height / 2) - rect.top;
    }

    const size = 60;
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.cssText = `
      left: ${x}px; top: ${y}px;
      width: ${size}px; height: ${size}px;
      margin-left: ${-size/2}px; margin-top: ${-size/2}px;
    `;
    $ripples().appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  function tick() {
    state.timeLeft--;
    $timer().textContent = state.timeLeft + 's';
    updateStats();
    if (state.timeLeft <= 0) finish();
  }

  function handleClick(e) {
    e.preventDefault();

    if (state.finished) return;

    // First click starts the test
    if (!state.running) {
      state.running   = true;
      state.clicks    = 0;
      state.startTime = Date.now();
      state.peakCPS   = 0;
      state.timeLeft  = state.duration;
      $zone().classList.add('running');
      $hint().style.opacity = '0';
      state.timer = setInterval(tick, 1000);
    }

    state.clicks++;

    // Pulse animation
    const big = $bigNum();
    big.classList.remove('pulse');
    void big.offsetWidth; // reflow
    big.classList.add('pulse');
    setTimeout(() => big.classList.remove('pulse'), 100);

    spawnRipple(e);
    updateStats();
  }

  function finish() {
    if (!state.running) return;
    state.running  = false;
    state.finished = true;
    clearInterval(state.timer);
    state.timer = null;

    $zone().classList.remove('running');

    const finalCPS = getCPS();
    const rating = getCPSRating(finalCPS);

    window.showResults('cps', [
      { val: finalCPS.toFixed(2), lbl: i18n.t('resCPS'), highlight: true },
      { val: state.clicks,        lbl: i18n.t('resClicks') },
      { val: state.peakCPS.toFixed(2), lbl: 'Peak CPS' },
      { val: state.duration + 's', lbl: i18n.t('resTime') },
      { val: rating,              lbl: i18n.t('ratingLabel') },
    ]);
  }

  function getCPSRating(cps) {
    if (cps < 3)  return i18n.t('ratingBeginner');
    if (cps < 5)  return i18n.t('ratingAverage');
    if (cps < 7)  return i18n.t('ratingGood');
    if (cps < 10) return i18n.t('ratingGreat');
    if (cps < 14) return i18n.t('ratingExcellent');
    return i18n.t('ratingProdigy');
  }

  function reset() {
    clearInterval(state.timer);
    state.timer    = null;
    state.running  = false;
    state.finished = false;
    state.clicks   = 0;
    state.startTime= null;
    state.peakCPS  = 0;
    state.timeLeft = state.duration;

    $zone().classList.remove('running');
    $bigNum().textContent  = '0.00';
    $current().textContent = '0.00';
    $clicks().textContent  = '0';
    $timer().textContent   = state.duration + 's';
    $hint().style.opacity  = '1';
    $hint().textContent    = i18n.t('clickToStart');
    $ripples().innerHTML   = '';
  }

  function init() {
    // Duration pills
    document.getElementById('cpsDuration').addEventListener('click', e => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      document.querySelectorAll('#cpsDuration .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.duration = parseInt(pill.dataset.value);
      if (!state.running) reset();
    });

    // Click & touch handlers
    const zone = $zone();
    zone.addEventListener('click',      handleClick);
    zone.addEventListener('touchstart', handleClick, { passive: false });

    // Keyboard spacebar on zone when focused
    zone.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleClick(e);
      }
    });

    $reset().addEventListener('click', reset);

    window.addEventListener('langchange', () => {
      if (!state.running) {
        $hint().textContent = i18n.t('clickToStart');
      }
    });
  }

  function retryLast() { reset(); }

  return { init, reset, retryLast };
})();
