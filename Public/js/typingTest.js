class TypingTest {
    constructor() {
        this.currentText = '';
        this.startTime = null;
        this.timerInterval = null;
        this.timeLeft = 60;
        this.isTestRunning = false;
        this.textLibrary = [];
        this.currentTextIndex = 0;
        this.duration = 60;
        this.fontSize = 'medium';
        this.typedCharsTotal = 0;
        this.initializeEventListeners();
        this.loadTextLibrary();
        this.applyFontSize();
    }

    initializeEventListeners() {
        const typingInput = document.getElementById('typing-input');
        const startBtn = document.getElementById('start-typing');
        const resetBtn = document.getElementById('reset-typing');
        const newTextBtn = document.getElementById('new-text');
        const durationSelect = document.getElementById('typing-duration');
        const fontSizeSelect = document.getElementById('typing-font-size');

        typingInput.addEventListener('input', (e) => this.handleTyping(e));
        typingInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        typingInput.addEventListener('paste', (e) => this.handlePaste(e));
        typingInput.addEventListener('copy', (e) => this.handleCopy(e));
        typingInput.addEventListener('cut', (e) => this.handleCut(e));
        startBtn.addEventListener('click', () => this.startTest());
        resetBtn.addEventListener('click', () => this.resetTest());
        newTextBtn.addEventListener('click', () => this.loadNewText());
        
        durationSelect.addEventListener('change', (e) => {
            this.duration = parseInt(e.target.value);
            if (!this.isTestRunning) {
                this.timeLeft = this.duration;
                document.getElementById('timer').textContent = `${this.timeLeft}s`;
            }
        });
        
        fontSizeSelect.addEventListener('change', (e) => {
            this.fontSize = e.target.value;
            this.applyFontSize();
        });

        window.addEventListener('resize', () => this.updateCursor());
    }

    applyFontSize() {
        const sampleTextElement = document.getElementById('sample-text');
        const sizes = {
            'small': { base: 'text-sm', sm: 'text-base' },
            'medium': { base: 'text-base', sm: 'text-lg' },
            'large': { base: 'text-lg', sm: 'text-xl' },
            'xlarge': { base: 'text-xl', sm: 'text-2xl' }
        };
        
        const sizeConfig = sizes[this.fontSize] || sizes.medium;
        
        // Retirer toutes les classes de taille
        sampleTextElement.classList.remove(
            'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl',
            'sm:text-sm', 'sm:text-base', 'sm:text-lg', 'sm:text-xl', 'sm:text-2xl'
        );
        
        // Ajouter les nouvelles tailles responsive
        sampleTextElement.classList.add(sizeConfig.base, `sm:${sizeConfig.sm}`);
    }

    loadTextLibrary() {
        this.loadComprehensiveFallbackTexts();
        this.loadNextText();
    }

    loadComprehensiveFallbackTexts() {
        const lang = window.languageManager.getCurrentLanguage();
        
        const comprehensiveTexts = {
            'fr': [
                // Premier groupe de textes cohérents
                "Le soleil brille intensément dans le ciel bleu aujourd'hui. Les enfants jouent joyeusement dans le parc municipal. Les oiseaux chantent mélodieusement dans les arbres verts. Une brise légère souffle doucement sur les visages. La vie semble paisible et harmonieuse en ce moment. Les fleurs colorées embellissent les jardins publics. Les gens se promènent tranquillement sur les sentiers. L'air frais du matin vivifie les esprits. Le bonheur simple se trouve dans ces instants. La nature offre un spectacle magnifique quotidien.",
                "La technologie moderne transforme notre quotidien progressivement. Les smartphones permettent une communication instantanée. Internet offre un accès illimité à l'information. Les réseaux sociaux connectent les gens du monde entier. L'innovation améliore constamment nos conditions de vie. Les ordinateurs facilitent le travail professionnel. Les applications mobiles simplifient les tâches. Les découvertes scientifiques repoussent les limites. Le progrès technologique avance rapidement. L'avenir numérique semble prometteur.",
                "L'éducation est fondamentale pour le développement personnel. L'apprentissage ouvre des portes vers de nouvelles opportunités. La connaissance permet de mieux comprendre le monde. Les compétences pratiques sont essentielles pour réussir. La curiosité intellectuelle favorise la croissance continue. Les enseignants guident les élèves patiemment. Les livres contiennent des trésors de savoir. Les universités forment les futurs leaders. L'éducation change des vies positivement. Le savoir est une richesse inestimable.",
                "La nature offre des paysages magnifiques à contempler. Les montagnes majestueuses dominent l'horizon lointain. Les rivières coulent paisiblement vers la mer. Les forêts abritent une biodiversité remarquable. La protection de l'environnement est cruciale pour l'avenir. Les océans vastes cachent des mystères profonds. Les déserts arides révèlent une beauté austère. Les saisons apportent leur lot de changements. La faune sauvage mérite notre respect. La flore diversifie les écosystèmes naturels.",
                "La cuisine française est réputée dans le monde entier. Les baguettes croustillantes sont appréciées quotidiennement. Le fromage constitue une tradition gastronomique importante. Le vin accompagne parfaitement les repas familiaux. La pâtisserie représente un art culinaire délicat. Les chefs étoilés innovent constamment. Les marchés locaux proposent des produits frais. Les recettes traditionnelles se transmettent entre générations. La gastronomie est une forme d'art vivant. Les saveurs variées enchantent les papilles.",
                "Les voyages enrichissent notre compréhension culturelle. Découvrir de nouveaux pays élargit nos perspectives. Rencontrer des personnes différentes favorise la tolérance. Apprendre des langues étrangères ouvre l'esprit. Les souvenirs de voyage restent précieux longtemps. Les monuments historiques racontent des histoires. Les paysages variés inspirent les voyageurs. Les coutumes locales fascinent les visiteurs. L'aventure touristique crée des liens. Le monde est vaste et merveilleux.",
                "La musique adoucit les mœurs et unit les gens. Les mélodies entraînantes font danser naturellement. Les paroles significatives touchent les cœurs sensibles. Les concerts créent des moments magiques inoubliables. L'apprentissage musical développe la créativité personnelle. Les instruments produisent des sons harmonieux. Les compositeurs expriment des émotions profondes. La musique classique traverse les siècles. Les rythmes modernes évoluent constamment. L'art musical transcende les frontières.",
                "Le sport maintient le corps en bonne santé physique. L'exercice régulier améliore le bien-être général. La compétition sportive enseigne la persévérance. L'esprit d'équipe renforce les liens sociaux. La discipline athlétique forge le caractère progressivement. Les matchs passionnants rassemblent les supporters. Les athlètes s'entraînent avec détermination. Les records sportifs sont constamment battus. L'effort physique libère des endorphines. Le mouvement est essentiel pour la santé.",
                "La lecture stimule l'imagination et la réflexion. Les livres transportent dans des univers fascinants. Les histoires captivantes divertissent agréablement. La littérature classique conserve sa valeur intemporelle. Les bibliothèques préservent le savoir collectif précieusement. Les auteurs talentueux inspirent les lecteurs. Les romans policiers maintiennent en haleine. Les poèmes expriment des sentiments profonds. La connaissance littéraire enrichit l'esprit. La culture écrite se perpétue généreusement.",
                "L'amitié véritable enrichit notre existence quotidienne. Les vrais amis soutiennent dans les moments difficiles. La confiance mutuelle fonde les relations durables. Le partage des expériences renforce les liens. La complicité amicale apporte du bonheur simple. Les conversations sincères rapprochent les cœurs. Les souvenirs communs créent des attaches. L'entraide spontanée caractérise l'amitié. La loyauté inconditionnelle est précieuse. Les amis fidèles sont des trésors rares.",
                "Le travail bien fait apporte une satisfaction profonde. La persévérance permet de surmonter les obstacles. La collaboration efficace produit des résultats remarquables. L'engagement professionnel mène à la réussite. L'apprentissage continu améliore les compétences constamment. Les projets ambitieux motivent les équipes. L'innovation transforme les méthodes de travail. L'excellence professionnelle est reconnue. Le dépassement de soi est valorisant. La réussite collective est gratifiante.",
                "Les saisons rythment le passage du temps naturellement. Le printemps apporte le renouveau et les fleurs. L'été offre la chaleur et les longues journées. L'automne colore les paysages de teintes chaudes. L'hiver transforme le monde en décor féerique. Le cycle des saisons est immuable. La nature s'adapte aux changements climatiques. Les activités varient selon les périodes. Les traditions saisonnières se perpétuent. La beauté naturelle évolue constamment.",
                "La famille constitue le noyau fondamental de la société. L'amour parental guide le développement des enfants. Les traditions familiales créent des souvenirs précieux. Le soutien familial aide à traverser les épreuves. Les réunions de famille renforcent l'unité collective. Les générations se côtoient harmonieusement. Les valeurs familiales se transmissent naturellement. L'héritage culturel est préservé. La solidarité familiale est essentielle. Les racines familiales donnent une identité.",
                "L'art exprime la beauté sous diverses formes créatives. La peinture capture des émotions visuelles intenses. La sculpture donne vie à la matière inanimée. La photographie immortalise des instants fugaces. La danse traduit des sentiments par le mouvement. Les artistes visionnaires inspirent le monde. Les galeries exposent des œuvres remarquables. L'art contemporain questionne la société. L'esthétique artistique évolue constamment. La création artistique est universelle.",
                "La science révèle les mystères de l'univers progressivement. La recherche médicale sauve des vies humaines. Les découvertes technologiques transforment la société. L'exploration spatiale élargit nos horizons. La curiosité scientifique drive l'innovation constante. Les chercheurs travaillent avec passion. Les laboratoires sont des lieux d'innovation. La méthode scientifique est rigoureuse. Le progrès scientifique bénéficie à tous. La connaissance scientifique est cumulative."
            ],
            'en': [
                // English versions of the same coherent texts
                "The sun shines brightly in the blue sky today. Children play happily in the city park. Birds sing melodiously in the green trees. A light breeze blows softly on faces. Life seems peaceful and harmonious at this moment. Colorful flowers beautify public gardens. People walk quietly on the paths. The fresh morning air invigorates spirits. Simple happiness is found in these moments. Nature offers a magnificent daily spectacle.",
                "Modern technology transforms our daily life gradually. Smartphones enable instant communication worldwide. Internet offers unlimited access to information. Social media connects people around the globe. Innovation constantly improves our living conditions. Computers facilitate professional work. Mobile applications simplify tasks. Scientific discoveries push boundaries. Technological progress advances rapidly. The digital future seems promising.",
                "Education is fundamental for personal development. Learning opens doors to new opportunities. Knowledge allows better understanding of the world. Practical skills are essential for success. Intellectual curiosity promotes continuous growth. Teachers guide students patiently. Books contain treasures of knowledge. Universities train future leaders. Education changes lives positively. Knowledge is an invaluable wealth.",
                "Nature offers beautiful landscapes to contemplate. Majestic mountains dominate the distant horizon. Rivers flow peacefully towards the sea. Forests host remarkable biodiversity. Environmental protection is crucial for the future. Vast oceans hide deep mysteries. Arid deserts reveal austere beauty. Seasons bring their share of changes. Wildlife deserves our respect. Flora diversifies natural ecosystems.",
                "French cuisine is renowned throughout the world. Crispy baguettes are appreciated daily. Cheese constitutes an important gastronomic tradition. Wine perfectly accompanies family meals. Pastry represents a delicate culinary art. Starred chefs constantly innovate. Local markets offer fresh products. Traditional recipes pass between generations. Gastronomy is a living art form. Varied flavors delight taste buds.",
                "Travel enriches our cultural understanding. Discovering new countries broadens our perspectives. Meeting different people promotes tolerance. Learning foreign languages opens the mind. Travel memories remain precious for long time. Historical monuments tell stories. Varied landscapes inspire travelers. Local customs fascinate visitors. Tourist adventure creates bonds. The world is vast and wonderful.",
                "Music softens manners and unites people. Catchy melodies make dance naturally. Meaningful lyrics touch sensitive hearts. Concerts create magical unforgettable moments. Musical learning develops personal creativity. Instruments produce harmonious sounds. Composers express deep emotions. Classical music crosses centuries. Modern rhythms constantly evolve. Musical art transcends borders.",
                "Sports maintain the body in good physical health. Regular exercise improves general well-being. Athletic competition teaches perseverance. Team spirit strengthens social bonds. Athletic discipline forges character progressively. Exciting matches gather supporters. Athletes train with determination. Sports records are constantly broken. Physical effort releases endorphins. Movement is essential for health.",
                "Reading stimulates imagination and reflection. Books transport to fascinating universes. Captivating stories entertain pleasantly. Classical literature preserves its timeless value. Libraries preserve collective knowledge preciously. Talented authors inspire readers. Detective novels keep in suspense. Poems express deep feelings. Literary knowledge enriches the mind. Written culture perpetuates generously.",
                "True friendship enriches our daily existence. Real friends support in difficult moments. Mutual trust founds lasting relationships. Sharing experiences strengthens bonds. Friendly complicity brings simple happiness. Sincere conversations bring hearts closer. Common memories create attachments. Spontaneous help characterizes friendship. Unconditional loyalty is precious. Faithful friends are rare treasures.",
                "Well-done work brings deep satisfaction. Perseverance allows overcoming obstacles. Effective collaboration produces remarkable results. Professional commitment leads to success. Continuous learning improves skills constantly. Ambitious projects motivate teams. Innovation transforms working methods. Professional excellence is recognized. Self-transcendence is rewarding. Collective success is gratifying.",
                "Seasons rhythm the passage of time naturally. Spring brings renewal and flowers. Summer offers warmth and long days. Autumn colors landscapes with warm hues. Winter transforms the world into fairy decor. The cycle of seasons is immutable. Nature adapts to climatic changes. Activities vary according to periods. Seasonal traditions perpetuate. Natural beauty constantly evolves.",
                "Family constitutes the fundamental core of society. Parental love guides children's development. Family traditions create precious memories. Family support helps overcome trials. Family gatherings strengthen collective unity. Generations coexist harmoniously. Family values transmit naturally. Cultural heritage is preserved. Family solidarity is essential. Family roots give an identity.",
                "Art expresses beauty under various creative forms. Painting captures intense visual emotions. Sculpture gives life to inanimate matter. Photography immortalizes fleeting moments. Dance translates feelings through movement. Visionary artists inspire the world. Galleries exhibit remarkable works. Contemporary art questions society. Artistic aesthetics constantly evolves. Artistic creation is universal.",
                "Science reveals universe mysteries progressively. Medical research saves human lives. Technological discoveries transform society. Space exploration expands our horizons. Scientific curiosity drives constant innovation. Researchers work with passion. Laboratories are places of innovation. Scientific method is rigorous. Scientific progress benefits everyone. Scientific knowledge is cumulative."
            ]
        };

        this.textLibrary = comprehensiveTexts[lang] || comprehensiveTexts['fr'];
    }

    loadNextText() {
        if (this.textLibrary.length === 0) {
            this.loadComprehensiveFallbackTexts();
        }
        
        // Prendre le texte suivant dans la bibliothèque
        this.currentText = this.textLibrary[this.currentTextIndex % this.textLibrary.length];
        this.currentTextIndex++;
        
        // Si on approche de la fin, recommencer depuis le début
        if (this.currentTextIndex >= this.textLibrary.length) {
            this.currentTextIndex = 0;
        }
        
        this.displaySampleText();
    }

    loadNewText() {
        if (!this.isTestRunning) {
            this.loadNextText();
            document.getElementById('typing-input').value = '';
            this.updateCursor();
            this.updateStats();
        }
    }

    displaySampleText() {
        const sampleTextElement = document.getElementById('sample-text');
        
        // Afficher plus de texte - environ 3-4 paragraphes
        let displayText = this.currentText;
        
        // Ajouter du texte supplémentaire si nécessaire
        const targetLength = 1500; // Environ 3-4 paragraphes
        while (displayText.length < targetLength && this.textLibrary.length > 1) {
            const nextIndex = (this.currentTextIndex + 1) % this.textLibrary.length;
            displayText += " " + this.textLibrary[nextIndex];
            this.currentTextIndex = nextIndex;
        }
        
        this.currentText = displayText;
        
        sampleTextElement.innerHTML = this.currentText.split('').map(char => 
            `<span class="char">${char}</span>`
        ).join('');
        
        this.updateCursor();
    }

    // Empêcher le copier-coller
    handlePaste(e) {
        e.preventDefault();
        const textContainer = document.getElementById('text-container');
        textContainer.classList.add('typing-error');
        setTimeout(() => textContainer.classList.remove('typing-error'), 1000);
    }

    handleCopy(e) {
        e.preventDefault();
    }

    handleCut(e) {
        e.preventDefault();
    }

    handleKeyDown(e) {
        if (!this.isTestRunning) return;

        const typedText = document.getElementById('typing-input').value;
        const cursorPosition = e.target.selectionStart;

        // Bloquer la suppression des caractères corrects
        if (e.key === 'Backspace') {
            for (let i = cursorPosition - 1; i >= 0; i--) {
                if (typedText[i] !== this.currentText[i]) {
                    return;
                }
            }
            e.preventDefault();
        }

        if (e.key === 'Delete') {
            e.preventDefault();
        }

        // Bloquer les raccourcis de copier-coller
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
            e.preventDefault();
        }
    }

    handleTyping(e) {
        if (!this.isTestRunning) return;

        const typedText = e.target.value;
        const lastTypedChar = typedText[typedText.length - 1];
        const expectedChar = this.currentText[typedText.length - 1];

        // Vérifier si le caractère est incorrect
        if (lastTypedChar !== expectedChar) {
            document.getElementById('typing-input').value = typedText.slice(0, -1);
            
            const textContainer = document.getElementById('text-container');
            textContainer.classList.add('typing-error');
            setTimeout(() => textContainer.classList.remove('typing-error'), 400);
            
            return;
        }
        
        // Transition fluide et imperceptible à 70% du texte
        if (typedText.length >= this.currentText.length * 0.7) {
            this.seamlesslyContinueText(typedText);
        } else {
            this.highlightText(typedText);
            this.updateCursor();
            this.updateStats();
        }
    }

    seamlesslyContinueText(typedText) {
        // Sauvegarder la progression
        const currentProgress = typedText.length;
        this.typedCharsTotal += currentProgress;
        
        // Charger le texte suivant
        this.loadNextText();
        
        // Transition invisible - garder une petite partie pour la continuité
        const overlapStart = Math.max(0, currentProgress - 50); // 50 caractères de chevauchement
        const remainingText = typedText.substring(overlapStart);
        
        document.getElementById('typing-input').value = remainingText;
        this.highlightText(remainingText);
        this.updateCursor();
        this.updateStats();
        
        // Faire défiler légèrement pour masquer la transition
        const textContainer = document.getElementById('text-container');
        textContainer.scrollTop += 10;
    }

    updateCursor() {
        const typedText = document.getElementById('typing-input').value;
        const cursor = document.getElementById('typing-cursor');
        const sampleTextElement = document.getElementById('sample-text');
        const textContainer = document.getElementById('text-container');
        const chars = sampleTextElement.querySelectorAll('.char');
        
        if (typedText.length < this.currentText.length && chars[typedText.length]) {
            const charElement = chars[typedText.length];
            const charRect = charElement.getBoundingClientRect();
            const containerRect = textContainer.getBoundingClientRect();
            
            cursor.style.left = (charRect.left - containerRect.left) + 'px';
            cursor.style.top = (charRect.top - containerRect.top) + 'px';
            cursor.style.opacity = '1';
            cursor.style.height = (charRect.height * 0.8) + 'px';
            
            this.scrollToCursor(charRect, containerRect);
        } else {
            cursor.style.opacity = '0';
        }
    }

    scrollToCursor(charRect, containerRect) {
        const textContainer = document.getElementById('text-container');
        const cursorTop = charRect.top - containerRect.top;
        const containerHeight = textContainer.clientHeight;
        
        if (cursorTop > containerHeight * 0.7) {
            const scrollDistance = cursorTop - containerHeight * 0.3;
            textContainer.scrollTop += scrollDistance;
        }
        
        if (cursorTop < containerHeight * 0.3) {
            const scrollDistance = cursorTop - containerHeight * 0.3;
            textContainer.scrollTop += scrollDistance;
        }
    }

    highlightText(typedText) {
        const sampleTextElement = document.getElementById('sample-text');
        const chars = sampleTextElement.querySelectorAll('.char');
        
        chars.forEach((charSpan, index) => {
            const typedChar = typedText[index];
            const actualChar = this.currentText[index];
            
            charSpan.className = 'char';
            
            if (index < typedText.length) {
                if (typedChar === actualChar) {
                    charSpan.classList.add('correct-char');
                }
            } else if (index === typedText.length) {
                charSpan.classList.add('current-char');
            }
        });
    }

    updateStats() {
        const typedText = document.getElementById('typing-input').value;
        const totalChars = this.typedCharsTotal + typedText.length;
        const words = Math.floor(totalChars / 5); // Estimation standard: 5 caractères par mot
        const timeElapsed = (Date.now() - this.startTime) / 60000;
        
        const wpm = timeElapsed > 0 ? Math.round(words / timeElapsed) : 0;
        
        let correctChars = 0;
        for (let i = 0; i < typedText.length; i++) {
            if (typedText[i] === this.currentText[i]) {
                correctChars++;
            }
        }
        const accuracy = totalChars > 0 ? Math.round((this.typedCharsTotal + correctChars) / totalChars * 100) : 100;
        
        document.getElementById('wpm').textContent = wpm;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
    }

    startTest() {
        if (this.isTestRunning) return;

        this.isTestRunning = true;
        this.timeLeft = this.duration;
        this.typedCharsTotal = 0;
        const typingInput = document.getElementById('typing-input');
        typingInput.disabled = false;
        typingInput.value = '';
        typingInput.focus();
        
        this.startTime = Date.now();
        this.startTimer();
        this.displaySampleText();
        this.updateStats();
        
        document.getElementById('timer').textContent = `${this.timeLeft}s`;
        document.getElementById('text-container').scrollTop = 0;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            document.getElementById('timer').textContent = `${this.timeLeft}s`;
            
            if (this.timeLeft <= 0) {
                this.endTest();
            }
        }, 1000);
    }

    endTest() {
        this.isTestRunning = false;
        clearInterval(this.timerInterval);
        document.getElementById('typing-input').disabled = true;
        
        const finalWPM = document.getElementById('wpm').textContent;
        const finalAccuracy = document.getElementById('accuracy').textContent;
        
        const results = {
            [window.languageManager.translate('wpmResult')]: `${finalWPM} MPM`,
            [window.languageManager.translate('accuracyResult')]: finalAccuracy,
            [window.languageManager.translate('testDuration')]: `${this.duration} seconds`
        };
        
        window.app.showResults(results);
    }

    resetTest() {
        this.isTestRunning = false;
        clearInterval(this.timerInterval);
        this.timeLeft = this.duration;
        this.typedCharsTotal = 0;
        document.getElementById('timer').textContent = `${this.timeLeft}s`;
        document.getElementById('wpm').textContent = '0';
        document.getElementById('accuracy').textContent = '100%';
        document.getElementById('typing-input').value = '';
        document.getElementById('typing-input').disabled = true;
        document.getElementById('text-container').scrollTop = 0;
        this.loadNextText();
    }

    onLanguageChange() {
        this.textLibrary = [];
        this.currentTextIndex = 0;
        this.loadTextLibrary();
        if (!this.isTestRunning) {
            this.resetTest();
        }
    }
}