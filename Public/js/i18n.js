/* =============================================
   KEYS & CLICK — i18n (EN / FR)
   ============================================= */

const i18n = (() => {

  const translations = {
    en: {
      heroTagline:      'measure. train. improve.',
      heroTitle:        'Your skills,<br/><em>benchmarked.</em>',
      tabTyping:        'Typing',
      tabCPS:           'CPS',
      tabKey:           'Keys',
      tabMouse:         'Aim',
      duration:         'Duration',
      textSize:         'Words',
      acc:              'ACC',
      time:             'TIME',
      clicks:           'CLICKS',
      keys:             'KEYS',
      hits:             'HITS',
      speed:            'Speed',
      targetSize:       'Size',
      accuracy:         'ACC',
      start:            'Start',
      reset:            'Reset',
      newText:          'New Text',
      retry:            'Retry',
      close:            'Close',
      small:            'S',
      medium:           'M',
      large:            'L',
      slow:             'Slow',
      normal:           'Normal',
      fast:             'Fast',
      insane:           'Insane',
      clickToStart:     'Tap to start',
      typingTitle:      'Typing Speed',
      typingPlaceholder:'Press Start to begin…',
      cpsTitle:         'Click Speed',
      keyTitle:         'Key Reaction',
      mouseTitle:       'Mouse Aim',
      resultsTitle:     'Results',
      // Results labels
      resWPM:           'WPM',
      resACC:           'Accuracy',
      resCPS:           'CPS',
      resClicks:        'Total Clicks',
      resKeys:          'Keys Hit',
      resHits:          'Targets Hit',
      resTime:          'Time',
      ratingLabel:      'Rating',
      // Ratings
      ratingBeginner:   'Beginner',
      ratingAverage:    'Average',
      ratingGood:       'Good',
      ratingGreat:      'Great',
      ratingExcellent:  'Excellent',
      ratingProdigy:    'Prodigy',
    },
    fr: {
      heroTagline:      'mesurer. entraîner. progresser.',
      heroTitle:        'Vos compétences,<br/><em>mesurées.</em>',
      tabTyping:        'Frappe',
      tabCPS:           'CPS',
      tabKey:           'Touches',
      tabMouse:         'Visée',
      duration:         'Durée',
      textSize:         'Mots',
      acc:              'PREC',
      time:             'TEMPS',
      clicks:           'CLICS',
      keys:             'TOUCHES',
      hits:             'CIBLES',
      speed:            'Vitesse',
      targetSize:       'Taille',
      accuracy:         'PREC',
      start:            'Démarrer',
      reset:            'Réinit.',
      newText:          'Nouveau',
      retry:            'Réessayer',
      close:            'Fermer',
      small:            'S',
      medium:           'M',
      large:            'L',
      slow:             'Lente',
      normal:           'Normale',
      fast:             'Rapide',
      insane:           'Extreme',
      clickToStart:     'Appuyer pour commencer',
      typingTitle:      'Vitesse de Frappe',
      typingPlaceholder:'Appuyez sur Démarrer…',
      cpsTitle:         'Vitesse de Clic',
      keyTitle:         'Réaction aux Touches',
      mouseTitle:       'Précision Souris',
      resultsTitle:     'Résultats',
      resWPM:           'MPM',
      resACC:           'Précision',
      resCPS:           'CPS',
      resClicks:        'Total Clics',
      resKeys:          'Touches',
      resHits:          'Cibles',
      resTime:          'Temps',
      ratingLabel:      'Niveau',
      ratingBeginner:   'Débutant',
      ratingAverage:    'Moyen',
      ratingGood:       'Bien',
      ratingGreat:      'Très bien',
      ratingExcellent:  'Excellent',
      ratingProdigy:    'Prodige',
    }
  };

  let currentLang = localStorage.getItem('kc-lang') || 'fr';

  function t(key) {
    return translations[currentLang][key] || translations['en'][key] || key;
  }

  function applyAll() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = translations[currentLang][key];
      if (val !== undefined) {
        if (el.innerHTML.includes('<')) {
          el.innerHTML = val;
        } else {
          el.textContent = val;
        }
      }
    });
    document.documentElement.lang = currentLang;
    document.getElementById('langLabel').textContent = currentLang === 'en' ? 'FR' : 'EN';
  }

  function toggle() {
    currentLang = currentLang === 'en' ? 'fr' : 'en';
    localStorage.setItem('kc-lang', currentLang);
    applyAll();
    // Notify modules
    window.dispatchEvent(new Event('langchange'));
  }

  function getLang() { return currentLang; }

  return { t, applyAll, toggle, getLang };
})();

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  i18n.applyAll();
  document.getElementById('langToggle').addEventListener('click', i18n.toggle);
});
