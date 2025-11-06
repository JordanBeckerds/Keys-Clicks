class KeyPressTest {
    constructor() {
        this.keysPressed = 0;
        this.correctKeys = 0;
        this.targetKey = '';
        this.isTestRunning = false;
        this.testDuration = 60;
        this.timeLeft = 60;
        this.timerInterval = null;
        this.keyHistory = [];
        this.maxHistory = 10;
        this.initializeEventListeners();
        this.generateNewTargetKey();
    }

    initializeEventListeners() {
        const startBtn = document.getElementById('start-keypress');
        const resetBtn = document.getElementById('reset-keypress');
        const durationSelect = document.getElementById('keypress-duration');

        startBtn.addEventListener('click', () => this.startTest());
        resetBtn.addEventListener('click', () => this.resetTest());
        durationSelect.addEventListener('change', (e) => {
            this.testDuration = parseInt(e.target.value);
            if (!this.isTestRunning) {
                this.timeLeft = this.testDuration;
                document.getElementById('key-timer').textContent = `${this.timeLeft}s`;
            }
        });
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    generateNewTargetKey() {
        const keys = ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'G', 'H', 'Z', 'X', 'C', 'V', 'B', 'N', 'M'];
        this.targetKey = keys[Math.floor(Math.random() * keys.length)];
        document.getElementById('target-key').textContent = this.targetKey;
    }

    startTest() {
        if (this.isTestRunning) return;

        this.isTestRunning = true;
        this.keysPressed = 0;
        this.correctKeys = 0;
        this.timeLeft = this.testDuration;
        this.keyHistory = [];
        
        document.getElementById('keys-pressed').textContent = '0';
        document.getElementById('key-accuracy').textContent = '0%';
        document.getElementById('key-timer').textContent = `${this.timeLeft}s`;
        document.getElementById('key-feedback').textContent = '';
        document.getElementById('key-history').innerHTML = '';

        this.generateNewTargetKey();
        this.startTimer();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            document.getElementById('key-timer').textContent = `${this.timeLeft}s`;
            
            if (this.timeLeft <= 0) {
                this.endTest();
            }
        }, 1000);
    }

    handleKeyPress(e) {
        if (!this.isTestRunning) return;

        const pressedKey = e.key.toUpperCase();
        this.keysPressed++;

        let isCorrect = false;
        let feedback = '';

        if (pressedKey === this.targetKey) {
            this.correctKeys++;
            isCorrect = true;
            feedback = '✓ Correct!';
            document.getElementById('key-feedback').className = 'text-xl text-green-400';
            
            // Animation de succès
            const targetElement = document.getElementById('target-key');
            targetElement.classList.add('scale-110');
            setTimeout(() => targetElement.classList.remove('scale-110'), 200);
            
            this.generateNewTargetKey();
        } else {
            feedback = `✗ Attendu: ${this.targetKey}`;
            document.getElementById('key-feedback').className = 'text-xl text-red-400';
            
            // Animation d'erreur
            const targetElement = document.getElementById('target-key');
            targetElement.classList.add('shake');
            setTimeout(() => targetElement.classList.remove('shake'), 300);
        }

        document.getElementById('key-feedback').textContent = feedback;
        document.getElementById('keys-pressed').textContent = this.keysPressed;
        
        const accuracy = this.keysPressed > 0 ? Math.round((this.correctKeys / this.keysPressed) * 100) : 0;
        document.getElementById('key-accuracy').textContent = `${accuracy}%`;

        // Ajouter à l'historique
        this.addToHistory(pressedKey, isCorrect);
    }

    addToHistory(key, isCorrect) {
        this.keyHistory.unshift({ key, isCorrect, timestamp: Date.now() });
        
        // Garder seulement les derniers éléments
        if (this.keyHistory.length > this.maxHistory) {
            this.keyHistory = this.keyHistory.slice(0, this.maxHistory);
        }

        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyContainer = document.getElementById('key-history');
        historyContainer.innerHTML = '';

        this.keyHistory.forEach(item => {
            const keyElement = document.createElement('div');
            keyElement.className = `key-history-item ${item.isCorrect ? 'key-correct' : 'key-incorrect'}`;
            keyElement.textContent = item.key;
            keyElement.title = new Date(item.timestamp).toLocaleTimeString();
            historyContainer.appendChild(keyElement);
        });
    }

    endTest() {
        this.isTestRunning = false;
        clearInterval(this.timerInterval);
        
        const accuracy = this.keysPressed > 0 ? Math.round((this.correctKeys / this.keysPressed) * 100) : 0;
        
        const results = {
            [window.languageManager.translate('keysPressed')]: this.keysPressed,
            [window.languageManager.translate('correctKeysResult')]: this.correctKeys,
            [window.languageManager.translate('accuracyResult')]: `${accuracy}%`,
            [window.languageManager.translate('testDuration')]: `${this.testDuration} seconds`
        };
        
        window.app.showResults(results);
    }

    resetTest() {
        this.isTestRunning = false;
        clearInterval(this.timerInterval);
        this.keysPressed = 0;
        this.correctKeys = 0;
        this.keyHistory = [];
        
        document.getElementById('keys-pressed').textContent = '0';
        document.getElementById('key-accuracy').textContent = '0%';
        document.getElementById('key-timer').textContent = `${this.testDuration}s`;
        document.getElementById('key-feedback').textContent = '';
        document.getElementById('key-history').innerHTML = '';
        
        this.generateNewTargetKey();
    }
}