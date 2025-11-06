// Language management system
class LanguageManager {
    constructor() {
        this.currentLanguage = 'fr';
        this.translations = {
            'fr': {
                // Navigation
                'typingTest': 'Test de Frappe',
                'cpsTest': 'Test CPS', 
                'keyPressTest': 'Test Clavier',
                'mouseTest': 'Précision Souris',
                
                // Common
                'startTest': 'Démarrer le Test',
                'reset': 'Réinitialiser',
                'time': 'Temps',
                'accuracy': 'Précision',
                'close': 'Fermer',
                'results': 'Résultats du Test',
                
                // Typing Test
                'typingTitle': 'Test de Vitesse de Frappe',
                'wpm': 'Mots/min',
                'startTyping': 'Commencez à taper ici...',
                'fontSize': 'Taille',
                'xlarge': 'Très grande',
                
                
                // Key Press Test
                'keyPressTitle': 'Test de Frappe au Clavier',
                'pressAnyKey': 'Appuyez sur n\'importe quelle touche',
                'keysPressed': 'Touches appuyées',
                
                // Mouse Test
                'mouseTitle': 'Test de Précision Souris',
                'targetsHit': 'Cibles touchées',
                'clickToStart': 'Cliquez sur Démarrer pour commencer',
                'testComplete': 'Test Terminé!',
                'speed': 'Vitesse',
                'targetSize': 'Taille',
                'slow': 'Lente',
                'fast': 'Rapide',
                'veryFast': 'Très rapide',
                'small': 'Petite',
                'large': 'Grande',
                'veryLarge': 'Très grande',

                // CPS
                'cpsTest': 'Test CPS',
                'cpsTitle': 'Test CPS (Clicks Par Seconde)',
                'cpsInstructions': 'Cliquez le plus rapidement possible dans la zone ci-dessous',
                'cps': 'CPS',
                'currentCPS': 'CPS Actuel',
                'clicks': 'Clicks',
                'timeLeft': 'Temps Restant',
                'textLength': 'Longueur',
                'newText': 'Nouveau Texte',
                'cpsResult': 'Clicks par seconde',
                'maxCPS': 'CPS Maximum',
                'averageCPS': 'CPS Moyen',
                'testDuration': 'Durée',
                'seconds': 'secondes',
                
                // Results
                'wpmResult': 'Mots par minute',
                'accuracyResult': 'Précision',
                'targetsHitResult': 'Cibles touchées',
                'totalTargets': 'Total des cibles',
                'testDuration': 'Durée du test'
            },
            'en': {
                // Navigation
                'typingTest': 'Typing Test',
                'cpsTest': 'CPS Test',
                'keyPressTest': 'Key Press Test', 
                'mouseTest': 'Mouse Accuracy',

                
                // Common
                'startTest': 'Start Test',
                'reset': 'Reset',
                'time': 'Time',
                'accuracy': 'Accuracy',
                'close': 'Close',
                'results': 'Test Results',
                
                // Typing Test
                'typingTitle': 'Typing Speed Test',
                'wpm': 'WPM',
                'startTyping': 'Start typing here...',
                'fontSize': 'Size',
                'xlarge': 'Very Large',
                
                // Key Press Test
                'keyPressTitle': 'Key Press Test',
                'pressAnyKey': 'Press any key to start',
                'keysPressed': 'Keys Pressed',
                
                // Mouse Test
                'mouseTitle': 'Mouse Accuracy Test',
                'targetsHit': 'Targets Hit',
                'clickToStart': 'Click Start to begin the test',
                'testComplete': 'Test Complete!',
                'speed': 'Speed',
                'targetSize': 'Size',
                'slow': 'Slow',
                'fast': 'Fast',
                'veryFast': 'Very Fast',
                'small': 'Small',
                'large': 'Large',
                'veryLarge': 'Very Large',

                // CPS
                'cpsTest': 'CPS Test',
                'cpsTitle': 'CPS Test (Clicks Per Second)',
                'cpsInstructions': 'Click as fast as possible in the area below',
                'cps': 'CPS',
                'currentCPS': 'Current CPS',
                'clicks': 'Clicks',
                'timeLeft': 'Time Left',
                'textLength': 'Length',
                'newText': 'New Text',
                'cpsResult': 'Clicks per second',
                'maxCPS': 'Max CPS',
                'averageCPS': 'Average CPS',
                'testDuration': 'Duration',
                'seconds': 'seconds',
                
                // Results
                'wpmResult': 'Words per minute',
                'accuracyResult': 'Accuracy',
                'targetsHitResult': 'Targets hit',
                'totalTargets': 'Total targets',
                'testDuration': 'Test duration'
            }
        };
        
        this.initializeLanguageSelector();
    }

    initializeLanguageSelector() {
        const selector = document.getElementById('language-select');
        selector.value = this.currentLanguage;
        
        selector.addEventListener('change', (e) => {
            this.setLanguage(e.target.value);
        });
    }

    setLanguage(lang) {
        this.currentLanguage = lang;
        this.updateAllText();
    }

    updateAllText() {
        // Update all elements with data-key attribute
        document.querySelectorAll('[data-key]').forEach(element => {
            const key = element.getAttribute('data-key');
            const translation = this.translations[this.currentLanguage][key];
            
            if (translation) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else {
                    // Check if element contains other HTML elements
                    if (element.children.length > 0) {
                        // For elements with children, only replace the text part
                        const span = element.querySelector('span');
                        if (span) {
                            // Keep the span content, update the text before it
                            const textBefore = element.childNodes[0];
                            if (textBefore && textBefore.nodeType === Node.TEXT_NODE) {
                                textBefore.textContent = translation.replace('{0}', '');
                            }
                        } else {
                            element.textContent = translation;
                        }
                    } else {
                        element.textContent = translation;
                    }
                }
            }
        });
    }

    translate(key, params = {}) {
        let translation = this.translations[this.currentLanguage][key] || key;
        
        // Replace parameters
        Object.keys(params).forEach(param => {
            translation = translation.replace(`{${param}}`, params[param]);
        });
        
        return translation;
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Initialize language manager
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager = new LanguageManager();
});