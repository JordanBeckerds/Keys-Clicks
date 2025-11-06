class App {
    constructor() {
        this.currentSection = 'typing-section';
        this.typingTest = null;
        this.cpsTest = null;
        this.keyPressTest = null;
        this.mouseTest = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Tab switching
        document.getElementById('typing-tab').addEventListener('click', () => this.switchSection('typing-section'));
        document.getElementById('cps-tab').addEventListener('click', () => this.switchSection('cps-section'));
        document.getElementById('keypress-tab').addEventListener('click', () => this.switchSection('keypress-section'));
        document.getElementById('mouse-tab').addEventListener('click', () => this.switchSection('mouse-section'));

        // Modal close
        document.getElementById('close-results').addEventListener('click', () => {
            document.getElementById('results-modal').classList.add('hidden');
        });

        // Language change
        document.getElementById('language-select').addEventListener('change', () => {
            if (this.typingTest) {
                this.typingTest.onLanguageChange?.();
            }
        });
    }

    switchSection(sectionId) {
        document.querySelectorAll('.test-section').forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('active');
        });

        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });

        document.getElementById(sectionId).classList.remove('hidden');
        document.getElementById(sectionId).classList.add('active');
        
        document.getElementById(sectionId.replace('section', 'tab')).classList.add('active');

        this.currentSection = sectionId;
    }

    showResults(results) {
        const resultsContent = document.getElementById('results-content');
        resultsContent.innerHTML = '';

        Object.entries(results).forEach(([key, value]) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'flex justify-between items-center py-2 border-b border-gray-700';
            
            const keySpan = document.createElement('span');
            keySpan.className = 'text-gray-400';
            keySpan.textContent = key;
            
            const valueSpan = document.createElement('span');
            valueSpan.className = 'font-semibold';
            valueSpan.textContent = value;

            resultItem.appendChild(keySpan);
            resultItem.appendChild(valueSpan);
            resultsContent.appendChild(resultItem);
        });

        document.getElementById('results-modal').classList.remove('hidden');
    }

    setTests(typingTest, cpsTest, keyPressTest, mouseTest) {
        this.typingTest = typingTest;
        this.cpsTest = cpsTest;
        this.keyPressTest = keyPressTest;
        this.mouseTest = mouseTest;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // Initialize tests after app is created
    const typingTest = new TypingTest();
    const cpsTest = new CPSTest();
    const keyPressTest = new KeyPressTest();
    const mouseTest = new MouseTest();
    
    window.app.setTests(typingTest, cpsTest, keyPressTest, mouseTest);
});