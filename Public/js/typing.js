/* =============================================
   KEYS & CLICK — Typing Test
   ============================================= */

const TypingTest = (() => {

  // ── Word Banks ──────────────────────────────
  const wordBanks = {
    en: [
      'the','be','to','of','and','a','in','that','have','it','for','not','on','with','he',
      'as','you','do','at','this','but','his','by','from','they','we','say','her','she','or',
      'an','will','my','one','all','would','there','their','what','so','up','out','if','about',
      'who','get','which','go','me','when','make','can','like','time','no','just','him','know',
      'take','people','into','year','your','good','some','could','them','see','other','than',
      'then','now','look','only','come','its','over','think','also','back','after','use','two',
      'how','our','work','first','well','way','even','new','want','because','any','these','give',
      'day','most','us','great','between','need','large','often','hand','high','place','hold',
      'turn','without','follow','act','why','ask','men','change','went','light','kind','off','need',
      'house','picture','try','again','animal','point','mother','world','near','build','self',
      'earth','father','head','stand','own','page','found','answer','school','grow','study','still',
      'learn','plant','cover','food','sun','four','between','state','keep','eye','never','last',
      'let','thought','city','tree','cross','farm','hard','start','might','story','saw','far',
      'sea','draw','left','late','run','don\'t','while','press','close','night','real','life',
      'few','north','open','seem','together','next','white','children','begin','got','walk','example',
      'ease','paper','group','always','music','those','both','mark','book','letter','until','mile',
      'river','car','feet','care','second','enough','plain','girl','usual','young','ready','above',
      'ever','red','list','though','feel','talk','bird','soon','body','dog','family','direct',
      'pose','leave','song','measure','door','product','black','short','numeral','class','wind',
      'question','happen','complete','ship','area','half','rock','order','fire','south','problem',
      'piece','told','knew','pass','since','top','whole','king','space','heard','best','hour',
      'better','true','during','hundred','five','remember','step','early','hold','west','ground',
      'interest','reach','fast','verb','sing','listen','six','table','travel','less','morning',
    ],
    fr: [
      'le','la','les','un','une','des','et','en','au','aux','du','de','que','qui','est','dans',
      'il','elle','nous','vous','ils','elles','ce','se','sa','son','ses','mon','ma','mes','ton',
      'ta','tes','leur','leurs','par','sur','sous','avec','sans','pour','mais','ou','donc','or',
      'car','si','ne','pas','plus','très','bien','tout','tous','toute','toutes','même','autre',
      'grand','petit','bon','beau','nouveau','vieux','jeune','long','haut','bas','fort','doux',
      'faire','avoir','être','aller','venir','voir','savoir','pouvoir','vouloir','devoir','prendre',
      'mettre','donner','dire','partir','tenir','sembler','rester','passer','trouver','arriver',
      'temps','main','jour','homme','femme','enfant','yeux','tête','ville','pays','monde','vie',
      'nuit','eau','corps','famille','maison','travail','porte','table','livre','place','côté',
      'chose','mot','heure','point','question','nombre','groupe','exemple','problème','fond',
      'moment','état','force','nature','forme','sens','droit','côté','pied','bras','coeur','voix',
      'lumière','couleur','route','chemin','pays','monde','terre','mer','ciel','soleil','nuit',
      'mouvement','pensée','action','idée','manière','suite','cours','début','fin','partie',
      'raison','air','regard','espace','vue','centre','front','coup','bord','fond','chair','rang',
    ]
  };

  // ── State ───────────────────────────────────
  let state = {
    running:    false,
    finished:   false,
    words:      [],
    charIndex:  0,
    totalChars: 0,
    correct:    0,
    wrong:      0,
    duration:   30,
    wordCount:  20,
    timer:      null,
    timeLeft:   30,
    startTime:  null,
    typed:      '',
  };

  // ── DOM refs ────────────────────────────────
  const $display   = () => document.getElementById('typingDisplay');
  const $input     = () => document.getElementById('typingInput');
  const $wpm       = () => document.getElementById('typingWPM');
  const $acc       = () => document.getElementById('typingAcc');
  const $timer     = () => document.getElementById('typingTimer');
  const $startBtn  = () => document.getElementById('typingStart');
  const $resetBtn  = () => document.getElementById('typingReset');
  const $newBtn    = () => document.getElementById('typingNewText');

  // ── Helpers ─────────────────────────────────
  function getLang() { return window.i18n ? i18n.getLang() : 'en'; }

  function getWords() {
    const bank = wordBanks[getLang()] || wordBanks.en;
    const arr  = [];
    const count = state.wordCount;
    for (let i = 0; i < count; i++) {
      arr.push(bank[Math.floor(Math.random() * bank.length)]);
    }
    return arr;
  }

  function buildDisplay() {
    const display = $display();
    display.innerHTML = '';
    state.charIndex = 0;
    state.totalChars = 0;

    state.words.forEach((word, wi) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';
      wordSpan.setAttribute('data-word', wi);

      // Add each character
      for (let ci = 0; ci < word.length; ci++) {
        const ch = document.createElement('span');
        ch.className = 'char pending';
        ch.setAttribute('data-global', state.totalChars);
        ch.textContent = word[ci];
        wordSpan.appendChild(ch);
        state.totalChars++;
      }

      // Space after word (not last)
      if (wi < state.words.length - 1) {
        const sp = document.createElement('span');
        sp.className = 'char pending space-char';
        sp.setAttribute('data-global', state.totalChars);
        sp.textContent = ' ';
        wordSpan.appendChild(sp);
        state.totalChars++;
      }

      display.appendChild(wordSpan);
    });

    // Set initial cursor
    setCursor(0);
  }

  function setCursor(idx) {
    // Remove old cursor
    document.querySelectorAll('.char.cursor').forEach(c => c.classList.remove('cursor'));
    const el = document.querySelector(`.char[data-global="${idx}"]`);
    if (el) el.classList.add('cursor');
  }

  function calcWPM() {
    const elapsed = (Date.now() - state.startTime) / 60000;
    if (elapsed <= 0) return 0;
    return Math.round((state.correct / 5) / elapsed);
  }

  function calcAcc() {
    const total = state.correct + state.wrong;
    if (total === 0) return 100;
    return Math.round((state.correct / total) * 100);
  }

  function updateStats() {
    $wpm().textContent   = calcWPM();
    $acc().textContent   = calcAcc() + '%';
    $timer().textContent = state.timeLeft + 's';
  }

  // ── Start ────────────────────────────────────
  function start() {
    if (state.running) return;
    state.running   = true;
    state.finished  = false;
    state.correct   = 0;
    state.wrong     = 0;
    state.charIndex = 0;
    state.typed     = '';
    state.timeLeft  = state.duration;
    state.startTime = null;

    $startBtn().disabled = true;
    $display().classList.add('active');
    $input().disabled = false;
    $input().value = '';
    $input().focus();

    buildDisplay();
    updateStats();
  }

  // ── Timer tick ───────────────────────────────
  function tick() {
    state.timeLeft--;
    $timer().textContent = state.timeLeft + 's';
    if (state.timeLeft <= 0) finish();
  }

  // ── Finish ───────────────────────────────────
  function finish() {
    if (!state.running) return;
    state.running  = false;
    state.finished = true;
    clearInterval(state.timer);
    state.timer = null;

    $input().disabled = true;
    $startBtn().disabled = false;
    $display().classList.remove('active');

    // Remove cursor
    document.querySelectorAll('.char.cursor').forEach(c => c.classList.remove('cursor'));

    // Show results
    const wpm = calcWPM();
    const acc = calcAcc();
    const rating = getTypingRating(wpm);

    window.showResults('typing', [
      { val: wpm,             lbl: i18n.t('resWPM'),   highlight: true },
      { val: acc + '%',       lbl: i18n.t('resACC') },
      { val: state.correct,   lbl: i18n.t('resKeys') },
      { val: state.duration + 's', lbl: i18n.t('resTime') },
      { val: rating,          lbl: i18n.t('ratingLabel') },
    ]);
  }

  function getTypingRating(wpm) {
    if (wpm < 20)  return i18n.t('ratingBeginner');
    if (wpm < 40)  return i18n.t('ratingAverage');
    if (wpm < 60)  return i18n.t('ratingGood');
    if (wpm < 80)  return i18n.t('ratingGreat');
    if (wpm < 100) return i18n.t('ratingExcellent');
    return i18n.t('ratingProdigy');
  }

  // ── Reset ────────────────────────────────────
  function reset() {
    clearInterval(state.timer);
    state.timer    = null;
    state.running  = false;
    state.finished = false;
    state.correct  = 0;
    state.wrong    = 0;
    state.charIndex= 0;
    state.timeLeft = state.duration;
    state.startTime= null;

    $input().disabled = true;
    $input().value    = '';
    $startBtn().disabled = false;
    $display().classList.remove('active');

    $wpm().textContent   = '0';
    $acc().textContent   = '100%';
    $timer().textContent = state.duration + 's';

    state.words = getWords();
    buildDisplay();
    $display().innerHTML = `<span class="placeholder-text">${i18n.t('typingPlaceholder')}</span>`;
  }

  // ── Input handler ────────────────────────────
  function handleInput(e) {
    if (!state.running) return;

    // Start timer on first keystroke
    if (!state.startTime) {
      state.startTime = Date.now();
      state.timer = setInterval(tick, 1000);
    }

    const val   = $input().value;
    const chars = document.querySelectorAll('.char[data-global]');

    // Rebuild from scratch each keystroke for accuracy
    let ci = 0;
    for (let wi = 0; wi < state.words.length; wi++) {
      const word = state.words[wi];
      const wordChars = word.length + (wi < state.words.length - 1 ? 1 : 0);

      for (let wci = 0; wci < wordChars; wci++) {
        const el = chars[ci];
        if (!el) { ci++; continue; }

        if (ci < val.length) {
          const typedChar  = val[ci];
          const targetChar = el.textContent;
          if (typedChar === targetChar) {
            el.className = 'char correct' + (el.classList.contains('space-char') ? ' space-char' : '');
          } else {
            el.className = 'char wrong' + (el.classList.contains('space-char') ? ' space-char' : '');
          }
        } else {
          el.className = 'char pending' + (el.classList.contains('space-char') ? ' space-char' : '');
        }
        ci++;
      }
    }

    // Update charIndex and cursor
    state.charIndex = Math.min(val.length, state.totalChars);
    setCursor(state.charIndex);

    // Count correct/wrong up to current position
    let correct = 0, wrong = 0;
    for (let i = 0; i < state.charIndex; i++) {
      const el = chars[i];
      if (el && el.classList.contains('correct')) correct++;
      if (el && el.classList.contains('wrong'))   wrong++;
    }
    state.correct = correct;
    state.wrong   = wrong;

    updateStats();

    // Auto-finish if all chars typed
    if (state.charIndex >= state.totalChars) finish();
  }

  // ── Init ─────────────────────────────────────
  function init() {
    state.words = getWords();

    // Duration pills
    document.getElementById('typingDuration').addEventListener('click', e => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      document.querySelectorAll('#typingDuration .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.duration = parseInt(pill.dataset.value);
      if (!state.running) {
        state.timeLeft = state.duration;
        $timer().textContent = state.duration + 's';
      }
    });

    // Word count pills
    document.getElementById('typingWords').addEventListener('click', e => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      document.querySelectorAll('#typingWords .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.wordCount = parseInt(pill.dataset.value);
      if (!state.running) { state.words = getWords(); }
    });

    $startBtn().addEventListener('click', start);
    $resetBtn().addEventListener('click', reset);
    $newBtn().addEventListener('click', () => {
      if (!state.running) {
        state.words = getWords();
        reset();
      }
    });

    // Click display to focus hidden input
    $display().addEventListener('click', () => {
      if (state.running) $input().focus();
    });

    $input().addEventListener('input', handleInput);

    // Prevent default on space to avoid scroll
    $input().addEventListener('keydown', e => {
      if (e.key === ' ') e.stopPropagation();
    });

    // Language change
    window.addEventListener('langchange', () => {
      if (!state.running) reset();
    });

    // Initial placeholder
    $display().innerHTML = `<span class="placeholder-text">${i18n.t('typingPlaceholder')}</span>`;
  }

  function retryLast() { reset(); start(); }

  return { init, reset, retryLast };
})();
