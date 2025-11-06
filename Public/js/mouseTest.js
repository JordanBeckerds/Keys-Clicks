class MouseTest {
    constructor() {
        this.targetsHit = 0;
        this.targetsTotal = 0;
        this.isTestRunning = false;
        this.timeLeft = 30;
        this.timerInterval = null;
        this.targetCreationInterval = null;
        this.targets = [];
        
        // Paramètres configurables
        this.speed = 'medium';
        this.targetSize = 'medium';
        this.duration = 30;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const testArea = document.getElementById('mouse-test-area');
        const resetBtn = document.getElementById('reset-mouse');
        const speedSelect = document.getElementById('mouse-speed');
        const sizeSelect = document.getElementById('mouse-target-size');
        const durationSelect = document.getElementById('mouse-duration');

        testArea.addEventListener('click', (e) => this.handleAreaClick(e));
        resetBtn.addEventListener('click', () => this.resetTest());
        
        speedSelect.addEventListener('change', (e) => {
            this.speed = e.target.value;
        });
        
        sizeSelect.addEventListener('change', (e) => {
            this.targetSize = e.target.value;
        });
        
        durationSelect.addEventListener('change', (e) => {
            this.duration = parseInt(e.target.value);
            if (!this.isTestRunning) {
                this.timeLeft = this.duration;
                document.getElementById('mouse-timer').textContent = `${this.timeLeft}s`;
            }
        });

        // Support tactile
        testArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleAreaClick(e);
        });
    }

    getSpeedSettings() {
        const speeds = {
            'slow': { interval: 2000, displayTime: 3000, maxTargets: 5 },
            'medium': { interval: 1200, displayTime: 2000, maxTargets: 8 },
            'fast': { interval: 800, displayTime: 1500, maxTargets: 10 },
            'very-fast': { interval: 500, displayTime: 1000, maxTargets: 12 }
        };
        return speeds[this.speed] || speeds.medium;
    }

    getSizeSettings() {
        const sizes = {
            'small': { min: 20, max: 35 },
            'medium': { min: 30, max: 50 },
            'large': { min: 40, max: 70 },
            'very-large': { min: 60, max: 90 }
        };
        return sizes[this.targetSize] || sizes.medium;
    }

    handleAreaClick(e) {
        const startScreen = document.getElementById('mouse-start-screen');
        
        // Démarrer le test si on clique sur l'écran de démarrage
        if (!this.isTestRunning && startScreen && (e.target === startScreen || e.target.closest('#mouse-start-screen'))) {
            this.startTest();
            return;
        }

        if (!this.isTestRunning) return;

        // Vérifier si on a cliqué sur une cible
        const clickedTarget = e.target.classList.contains('target-circle') ? e.target : null;
        
        if (clickedTarget) {
            this.hitTarget(clickedTarget);
        } else {
            // Cliqué à côté d'une cible
            this.targetsTotal++;
            this.updateAccuracy();
            
            // Animation de feedback d'erreur
            this.createMissEffect(e);
        }
    }

    createMissEffect(e) {
        const testArea = document.getElementById('mouse-test-area');
        const rect = testArea.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const effect = document.createElement('div');
        effect.className = 'target-miss-effect';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        effect.style.width = '30px';
        effect.style.height = '30px';

        testArea.appendChild(effect);
        setTimeout(() => effect.remove(), 600);
    }

    startTest() {
        if (this.isTestRunning) return;

        this.isTestRunning = true;
        this.targetsHit = 0;
        this.targetsTotal = 0;
        this.timeLeft = this.duration;
        this.targets = [];
        
        document.getElementById('targets-hit').textContent = '0';
        document.getElementById('mouse-accuracy').textContent = '0%';
        document.getElementById('mouse-timer').textContent = `${this.timeLeft}s`;

        const testArea = document.getElementById('mouse-test-area');
        const startScreen = document.getElementById('mouse-start-screen');
        if (startScreen) {
            startScreen.remove();
        }
        testArea.classList.remove('border-dashed');
        testArea.classList.add('border-solid', 'border-green-500');
        
        this.startTimer();
        this.startCreatingTargets();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            document.getElementById('mouse-timer').textContent = `${this.timeLeft}s`;
            
            if (this.timeLeft <= 0) {
                this.endTest();
            }
        }, 1000);
    }

    startCreatingTargets() {
        const speedSettings = this.getSpeedSettings();
        
        // Créer des cibles à intervalles variables
        this.targetCreationInterval = setInterval(() => {
            if (this.isTestRunning && this.targets.length < speedSettings.maxTargets) {
                this.createTarget();
            }
        }, speedSettings.interval);
    }

    createTarget() {
        if (!this.isTestRunning) return;

        const testArea = document.getElementById('mouse-test-area');
        const target = document.createElement('div');
        const sizeSettings = this.getSizeSettings();
        const speedSettings = this.getSpeedSettings();
        
        // Taille selon les paramètres
        const isMobile = window.innerWidth < 768;
        const baseSize = isMobile ? sizeSettings.min + 10 : sizeSettings.min;
        const size = baseSize + Math.random() * (sizeSettings.max - sizeSettings.min);
        
        // Position avec marges
        const margin = 20;
        const x = margin + Math.random() * (testArea.offsetWidth - size - margin * 2);
        const y = margin + Math.random() * (testArea.offsetHeight - size - margin * 2);
        
        target.className = 'target-circle';
        target.style.width = `${size}px`;
        target.style.height = `${size}px`;
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
        
        // Couleur aléatoire
        const hue = Math.random() * 60 + 200; // Bleus
        target.style.background = `radial-gradient(circle, hsl(${hue}, 80%, 60%), hsl(${hue}, 80%, 40%))`;
        
        testArea.appendChild(target);
        this.targets.push(target);
        this.targetsTotal++;
        
        // Supprimer la cible après un délai selon la vitesse
        const targetTimeout = setTimeout(() => {
            if (target.parentNode) {
                this.removeTarget(target, false);
            }
        }, speedSettings.displayTime);

        target.dataset.timeout = targetTimeout;
    }

    hitTarget(target) {
        if (!this.isTestRunning) return;

        this.targetsHit++;
        
        // Animation de succès améliorée
        target.classList.add('target-success');
        clearTimeout(target.dataset.timeout);
        
        setTimeout(() => {
            if (target.parentNode) {
                target.remove();
                this.targets = this.targets.filter(t => t !== target);
            }
        }, 600);
        
        document.getElementById('targets-hit').textContent = this.targetsHit;
        this.updateAccuracy();
        
        // Créer une nouvelle cible après un court délai
        setTimeout(() => {
            if (this.isTestRunning) {
                this.createTarget();
            }
        }, 200);
    }

    removeTarget(target, updateAccuracy = true) {
        target.classList.add('target-disappear');
        
        setTimeout(() => {
            if (target.parentNode) {
                target.remove();
                this.targets = this.targets.filter(t => t !== target);
                if (updateAccuracy) {
                    this.updateAccuracy();
                }
            }
        }, 300);
    }

    updateAccuracy() {
        const accuracy = this.targetsTotal > 0 ? Math.round((this.targetsHit / this.targetsTotal) * 100) : 0;
        document.getElementById('mouse-accuracy').textContent = `${accuracy}%`;
    }

    endTest() {
        this.isTestRunning = false;
        clearInterval(this.timerInterval);
        clearInterval(this.targetCreationInterval);
        
        // Supprimer toutes les cibles restantes
        this.targets.forEach(target => {
            clearTimeout(target.dataset.timeout);
            this.removeTarget(target, false);
        });
        
        const testArea = document.getElementById('mouse-test-area');
        testArea.innerHTML = `
            <div class="absolute inset-0 flex items-center justify-center text-center p-4 sm:p-8 bg-gray-800 bg-opacity-90">
                <div>
                    <div class="text-lg sm:text-2xl text-green-400 mb-3 sm:mb-4">${window.languageManager.translate('testComplete')}</div>
                    <div class="text-sm sm:text-base text-gray-400">
                        ${this.targetsHit} ${window.languageManager.translate('targetsHitResult')} sur ${this.targetsTotal}
                    </div>
                    <div class="text-sm sm:text-base text-blue-400 mt-2">
                        Précision: ${this.targetsTotal > 0 ? Math.round((this.targetsHit / this.targetsTotal) * 100) : 0}%
                    </div>
                </div>
            </div>
        `;
        testArea.classList.remove('border-solid', 'border-green-500');
        testArea.classList.add('border-dashed');
        
        const finalAccuracy = document.getElementById('mouse-accuracy').textContent;
        
        const results = {
            [window.languageManager.translate('targetsHitResult')]: this.targetsHit,
            [window.languageManager.translate('accuracyResult')]: finalAccuracy,
            [window.languageManager.translate('totalTargets')]: this.targetsTotal,
            [window.languageManager.translate('testDuration')]: `${this.duration} seconds`
        };
        
        window.app.showResults(results);
    }

    resetTest() {
        this.isTestRunning = false;
        clearInterval(this.timerInterval);
        clearInterval(this.targetCreationInterval);
        
        // Supprimer toutes les cibles
        this.targets.forEach(target => {
            clearTimeout(target.dataset.timeout);
            if (target.parentNode) {
                target.remove();
            }
        });
        this.targets = [];
        
        const testArea = document.getElementById('mouse-test-area');
        testArea.innerHTML = `
            <div id="mouse-start-screen" class="absolute inset-0 flex items-center justify-center text-center p-4 sm:p-8 cursor-pointer">
                <div>
                    <div class="text-lg sm:text-2xl text-blue-400 mb-3 sm:mb-4" data-key="clickToStart">Cliquez pour commencer le test</div>
                    <div class="text-xs sm:text-base text-gray-400" data-key="mouseInstructions">
                        Cliquez sur les cercles qui apparaîtront le plus rapidement possible
                    </div>
                </div>
            </div>
        `;
        testArea.classList.remove('border-solid', 'border-green-500');
        testArea.classList.add('border-dashed');
        
        document.getElementById('targets-hit').textContent = '0';
        document.getElementById('mouse-accuracy').textContent = '0%';
        document.getElementById('mouse-timer').textContent = `${this.duration}s`;
    }
}