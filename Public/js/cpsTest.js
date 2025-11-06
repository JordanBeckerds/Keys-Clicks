class CPSTest {
    constructor() {
        this.clicks = 0;
        this.startTime = null;
        this.isTestRunning = false;
        this.testDuration = 10;
        this.timeLeft = 10;
        this.timerInterval = null;
        this.clickTimes = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const resetBtn = document.getElementById('reset-cps');
        const testArea = document.getElementById('cps-test-area');
        const durationSelect = document.getElementById('cps-duration');

        resetBtn.addEventListener('click', () => this.resetTest());
        testArea.addEventListener('click', (e) => this.handleClick(e));
        durationSelect.addEventListener('change', (e) => {
            this.testDuration = parseInt(e.target.value);
            if (!this.isTestRunning) {
                this.timeLeft = this.testDuration;
                document.getElementById('time-left').textContent = `${this.timeLeft}s`;
            }
        });
    }

    handleClick(e) {
        // Si le test n'est pas en cours, le démarrer
        if (!this.isTestRunning) {
            this.startTest();
            return;
        }

        // Compter le click
        this.clicks++;
        const currentTime = Date.now();
        this.clickTimes.push(currentTime);

        // Calculer le CPS actuel
        const threeSecondsAgo = currentTime - 3000;
        const recentClicks = this.clickTimes.filter(time => time > threeSecondsAgo);
        const currentCPS = recentClicks.length / 3;

        // Mettre à jour l'affichage
        document.getElementById('clicks-count').textContent = this.clicks;
        document.getElementById('current-cps').textContent = currentCPS.toFixed(2);
        document.getElementById('cps-display').textContent = currentCPS.toFixed(2);

        // Animation de feedback
        this.createClickEffect(e);
        this.updateColorBasedOnPerformance(currentCPS);
    }

    createClickEffect(e) {
        const testArea = document.getElementById('cps-test-area');
        const rect = testArea.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const effect = document.createElement('div');
        effect.className = 'cps-click-effect';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        effect.style.width = '20px';
        effect.style.height = '20px';

        testArea.appendChild(effect);
        setTimeout(() => effect.remove(), 600);
    }

    startTest() {
        this.isTestRunning = true;
        this.clicks = 0;
        this.timeLeft = this.testDuration;
        this.clickTimes = [];
        
        document.getElementById('clicks-count').textContent = '0';
        document.getElementById('current-cps').textContent = '0.00';
        document.getElementById('cps-display').textContent = '0.00';
        document.getElementById('time-left').textContent = `${this.timeLeft}s`;

        const testArea = document.getElementById('cps-test-area');
        testArea.classList.remove('bg-gray-700');
        testArea.classList.add('bg-green-600');
        testArea.innerHTML = `
            <div class="text-center">
                <div class="text-4xl font-bold text-white mb-2" id="cps-display">0.00</div>
                <div class="text-lg text-blue-300">${window.languageManager.translate('cps')}</div>
                <div class="text-sm text-white mt-2">${this.clicks} ${window.languageManager.translate('clicks')}</div>
            </div>
        `;

        this.startTime = Date.now();
        this.startTimer();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            document.getElementById('time-left').textContent = `${this.timeLeft}s`;
            
            if (this.timeLeft <= 0) {
                this.endTest();
            }
        }, 1000);
    }

    updateColorBasedOnPerformance(cps) {
        const testArea = document.getElementById('cps-test-area');
        testArea.classList.remove('bg-green-600', 'bg-yellow-500', 'bg-orange-500', 'bg-red-600', 'bg-purple-600');
        
        if (cps < 5) {
            testArea.classList.add('bg-green-600');
        } else if (cps < 8) {
            testArea.classList.add('bg-yellow-500');
        } else if (cps < 12) {
            testArea.classList.add('bg-orange-500');
        } else if (cps < 15) {
            testArea.classList.add('bg-red-600');
        } else {
            testArea.classList.add('bg-purple-600');
        }
    }

    endTest() {
        this.isTestRunning = false;
        clearInterval(this.timerInterval);

        const averageCPS = this.clicks / this.testDuration;
        
        // Calculer le CPS maximum
        let maxCPS = 0;
        for (let i = 0; i < this.clickTimes.length; i++) {
            const oneSecondLater = this.clickTimes[i] + 1000;
            const clicksInSecond = this.clickTimes.filter(time => 
                time >= this.clickTimes[i] && time <= oneSecondLater
            ).length;
            maxCPS = Math.max(maxCPS, clicksInSecond);
        }

        const testArea = document.getElementById('cps-test-area');
        testArea.classList.remove('bg-green-600', 'bg-yellow-500', 'bg-orange-500', 'bg-red-600', 'bg-purple-600');
        testArea.classList.add('bg-gray-700');
        testArea.innerHTML = `
            <div class="text-center">
                <div class="text-2xl font-bold text-green-400 mb-2">${averageCPS.toFixed(2)} CPS</div>
                <div class="text-lg text-gray-300">${window.languageManager.translate('testComplete')}</div>
                <div class="text-sm text-gray-400 mt-2">${this.clicks} ${window.languageManager.translate('clicks')}</div>
            </div>
        `;

        const results = {
            [window.languageManager.translate('cpsResult')]: averageCPS.toFixed(2),
            [window.languageManager.translate('maxCPS')]: maxCPS.toFixed(2),
            [window.languageManager.translate('clicks')]: this.clicks,
            [window.languageManager.translate('testDuration')]: `${this.testDuration} seconds`
        };
        
        window.app.showResults(results);
    }

    resetTest() {
        this.isTestRunning = false;
        clearInterval(this.timerInterval);
        
        const testArea = document.getElementById('cps-test-area');
        testArea.classList.remove('bg-green-600', 'bg-yellow-500', 'bg-orange-500', 'bg-red-600', 'bg-purple-600');
        testArea.classList.add('bg-gray-700');
        testArea.innerHTML = `
            <div class="text-center">
                <div class="text-4xl font-bold text-white mb-2" id="cps-display">0.00</div>
                <div class="text-lg text-blue-300">${window.languageManager.translate('cps')}</div>
                <div class="text-sm text-gray-300 mt-2" data-key="clickToStart">Cliquez pour commencer</div>
            </div>
        `;
        
        document.getElementById('clicks-count').textContent = '0';
        document.getElementById('current-cps').textContent = '0.00';
        document.getElementById('time-left').textContent = `${this.testDuration}s`;
    }
}