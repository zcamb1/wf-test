```
// index.html - Main Entry Point
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wordcraft Legends - English Learning Game</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #2d3748;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: Arial, sans-serif;
            color: #fff;
        }
        #game-container {
            width: 100%;
            max-width: 900px;
            height: 600px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            position: relative;
        }
        .font-preload {
            font-family: 'Quicksand', sans-serif;
            position: absolute;
            left: -1000px;
        }
        #loading-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #3a1c71;
            background-image: linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 100;
        }
        #progress-bar {
            width: 300px;
            height: 20px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            margin-top: 20px;
            overflow: hidden;
        }
        #progress-fill {
            height: 100%;
            width: 0%;
            background-color: #fff;
            transition: width 0.3s;
        }
        #loading-text {
            margin-top: 10px;
            font-size: 14px;
        }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js"></script>
</head>
<body>
    <div id="game-container">
        <div id="loading-screen">
            <h1>Wordcraft Legends</h1>
            <div id="progress-bar">
                <div id="progress-fill"></div>
            </div>
            <div id="loading-text">Loading game assets...</div>
        </div>
    </div>
    
    <div class="font-preload">.</div>

    <script src="js/config.js"></script>
    <script src="js/utils.js"></script>
    <script src="js/components.js"></script>
    <script src="js/data.js"></script>
    <script src="js/scenes/BootScene.js"></script>
    <script src="js/scenes/PreloadScene.js"></script>
    <script src="js/scenes/IntroScene.js"></script>
    <script src="js/scenes/CharacterSelectScene.js"></script>
    <script src="js/scenes/WorldMapScene.js"></script>
    <script src="js/scenes/BattleScene.js"></script>
    <script src="js/scenes/CraftingScene.js"></script>
    <script src="js/scenes/ConversationScene.js"></script>
    <script src="js/scenes/RhythmScene.js"></script>
    <script src="js/scenes/UIScene.js"></script>
    <script src="js/main.js"></script>
</body>
</html>

// js/config.js - Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a365d',
    pixelArt: false,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    dom: {
        createContainer: true
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        BootScene, 
        PreloadScene, 
        IntroScene, 
        CharacterSelectScene, 
        WorldMapScene, 
        BattleScene, 
        CraftingScene, 
        ConversationScene, 
        RhythmScene,
        UIScene
    ]
};

// js/utils.js - Utility Functions
const Utils = {
    formatTime: function(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    },
    
    getRandomItem: function(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    createButton: function(scene, x, y, text, style, callback) {
        const button = scene.add.text(x, y, text, style)
            .setOrigin(0.5)
            .setPadding(10)
            .setStyle({ backgroundColor: '#111' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => callback())
            .on('pointerover', () => button.setStyle({ fill: '#f39c12' }))
            .on('pointerout', () => button.setStyle({ fill: '#FFF' }));
        
        return button;
    },
    
    showToast: function(scene, message, duration = 3000) {
        const toast = scene.add.text(
            scene.cameras.main.width / 2, 
            scene.cameras.main.height - 100, 
            message, 
            { 
                fontFamily: 'Quicksand',
                fontSize: '18px', 
                fill: '#fff',
                padding: { x: 15, y: 10 },
                backgroundColor: '#333',
                borderRadius: 8
            }
        )
        .setOrigin(0.5)
        .setDepth(1000)
        .setAlpha(0);
        
        scene.tweens.add({
            targets: toast,
            alpha: 1,
            y: scene.cameras.main.height - 120,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                scene.time.delayedCall(duration, () => {
                    scene.tweens.add({
                        targets: toast,
                        alpha: 0,
                        y: scene.cameras.main.height - 100,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => {
                            toast.destroy();
                        }
                    });
                });
            }
        });
    },
    
    lerp: function(a, b, t) {
        return a + (b - a) * t;
    },
    
    addFloatingText: function(scene, x, y, text, style = {}) {
        const defaultStyle = { 
            fontFamily: 'Quicksand',
            fontSize: '20px', 
            fontStyle: 'bold',
            fill: '#fff', 
            stroke: '#000',
            strokeThickness: 4
        };
        
        const mergedStyle = {...defaultStyle, ...style};
        const floatingText = scene.add.text(x, y, text, mergedStyle)
            .setOrigin(0.5)
            .setDepth(100);
        
        scene.tweens.add({
            targets: floatingText,
            y: y - 50,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => floatingText.destroy()
        });
        
        return floatingText;
    },
    
    shakeCamera: function(scene, intensity = 0.01, duration = 100) {
        scene.cameras.main.shake(duration, intensity);
    }
};

// js/components.js - Reusable UI Components
class ProgressBar extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height, value, maxValue, color, backgroundColor = 0x333333) {
        super(scene, x, y);
        
        this.width = width;
        this.height = height;
        this.value = value;
        this.maxValue = maxValue;
        
        this.background = scene.add.rectangle(0, 0, width, height, backgroundColor)
            .setOrigin(0, 0.5);
        
        this.bar = scene.add.rectangle(0, 0, this.getBarWidth(), height, color)
            .setOrigin(0, 0.5);
        
        this.add([this.background, this.bar]);
        scene.add.existing(this);
    }
    
    getBarWidth() {
        return (this.value / this.maxValue) * this.width;
    }
    
    setValue(value) {
        this.value = Phaser.Math.Clamp(value, 0, this.maxValue);
        
        if (this.bar) {
            this.scene.tweens.add({
                targets: this.bar,
                width: this.getBarWidth(),
                duration: 300,
                ease: 'Power2'
            });
        }
    }
}

class HealthBar extends ProgressBar {
    constructor(scene, x, y, width, height, value, maxValue) {
        super(scene, x, y, width, height, value, maxValue, 0x4ade80);
        
        this.label = scene.add.text(-5, 0, `${value}/${maxValue} HP`, {
            fontFamily: 'Quicksand',
            fontSize: '14px',
            fill: '#fff'
        }).setOrigin(1, 0.5);
        
        this.add(this.label);
    }
    
    setValue(value) {
        super.setValue(value);
        this.label.setText(`${Math.floor(this.value)}/${this.maxValue} HP`);
        
        if (this.value < this.maxValue * 0.3) {
            this.bar.fillColor = 0xef4444; // Red when low health
        } else if (this.value < this.maxValue * 0.6) {
            this.bar.fillColor = 0xfacc15; // Yellow when medium health
        } else {
            this.bar.fillColor = 0x4ade80; // Green when high health
        }
    }
}

class Button extends Phaser.GameObjects.Container {
    constructor(scene, x, y, text, textStyle = {}, callback = () => {}, width = 180, height = 50) {
        super(scene, x, y);
        
        this.width = width;
        this.height = height;
        
        // Default text style
        const defaultTextStyle = {
            fontFamily: 'Quicksand',
            fontSize: '18px',
            fill: '#fff'
        };
        
        const mergedTextStyle = {...defaultTextStyle, ...textStyle};
        
        // Background
        this.background = scene.add.rectangle(0, 0, width, height, 0x6366f1)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        
        // Text
        this.text = scene.add.text(0, 0, text, mergedTextStyle)
            .setOrigin(0.5);
        
        this.add([this.background, this.text]);
        
        // Events
        this.background.on('pointerover', () => {
            this.background.fillColor = 0x4f46e5; // Darker color on hover
        });
        
        this.background.on('pointerout', () => {
            this.background.fillColor = 0x6366f1; // Original color
        });
        
        this.background.on('pointerdown', () => {
            this.background.fillColor = 0x4338ca; // Even darker on click
            
            // Scale effect
            scene.tweens.add({
                targets: this,
                scale: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: callback
            });
        });
        
        scene.add.existing(this);
    }
    
    disable() {
        this.background.disableInteractive();
        this.background.fillColor = 0x9ca3af; // Gray color when disabled
        this.text.setAlpha(0.6);
    }
    
    enable() {
        this.background.setInteractive({ useHandCursor: true });
        this.background.fillColor = 0x6366f1; // Original color
        this.text.setAlpha(1);
    }
}

// js/data.js - Game Data Storage
const GameData = {
    player: {
        name: '',
        class: '',
        level: 1,
        experience: 0,
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        stats: {
            strength: 10,
            intellect: 10,
            agility: 10,
            stamina: 10,
            skillPoints: 0
        },
        inventory: {
            gems: 100,
            potions: {
                health: 2,
                energy: 3,
                knowledge: 1,
                hintBook: 2,
                shieldScroll: 1,
                doubleDamage: 1
            },
            words: [],
            phrases: []
        },
        progress: {
            battlesWon: 0,
            wordsLearned: 0,
            questsCompleted: 0,
            regionsUnlocked: 1
        },
        avatar: '👤',
        score: 0
    },
    
    characterClasses: [
        {
            id: 'wordsmith',
            name: 'Wordsmith',
            description: 'Masters of vocabulary with strong critical hits',
            avatar: '⚒️',
            color: 0xf59e0b,
            strengths: ['Vocabulary battles', 'Word crafting'],
            specialAbility: 'Critical Word: 20% chance to deal double damage in battles'
        },
        {
            id: 'grammarian',
            name: 'Grammarian',
            description: 'Experts in sentence structure with defensive prowess',
            avatar: '📜',
            color: 0x3b82f6,
            strengths: ['Grammar challenges', 'Adventure mode'],
            specialAbility: 'Sentence Shield: 25% chance to block incoming damage'
        },
        {
            id: 'melodist',
            name: 'Melodist',
            description: 'Masters of pronunciation with combo abilities',
            avatar: '🎵',
            color: 0xd946ef,
            strengths: ['Pronunciation rhythm', 'Conversation flow'],
            specialAbility: 'Flow State: Combo multiplier increases 25% faster'
        },
        {
            id: 'sage',
            name: 'Sage',
            description: 'Well-rounded scholars with resource efficiency',
            avatar: '🧠',
            color: 0x10b981,
            strengths: ['All-around balanced', 'Resource management'],
            specialAbility: 'Deep Knowledge: 30% chance to not consume energy on actions'
        }
    ],
    
    worldRegions: [
        {
            id: 'vocabVillage',
            name: 'Vocabulary Village',
            description: 'A colorful town where every building represents a different category of words.',
            icon: '🏘️',
            color: 0x10b981,
            position: { x: 300, y: 200 },
            unlocked: true,
            level: '1-5',
            activities: ['battle', 'conversation', 'craft'],
            enemies: [
                {
                    id: 'noun_novice',
                    name: 'Noun Novice',
                    type: 'vocabulary',
                    level: 1,
                    health: 80,
                    maxHealth: 80,
                    avatar: '📦',
                    color: 0x10b981,
                    difficulty: 'easy',
                    description: 'A beginner vocabulary guardian that tests your knowledge of basic nouns',
                    rewards: { xp: 20, gems: 5 }
                },
                {
                    id: 'verb_vagrant',
                    name: 'Verb Vagrant',
                    type: 'vocabulary',
                    level: 2,
                    health: 100,
                    maxHealth: 100,
                    avatar: '🏃',
                    color: 0x3b82f6,
                    difficulty: 'easy',
                    description: 'A roaming monster that challenges your knowledge of action words',
                    rewards: { xp: 25, gems: 8 }
                },
                {
                    id: 'adjective_apprentice',
                    name: 'Adjective Apprentice',
                    type: 'vocabulary',
                    level: 3,
                    health: 120,
                    maxHealth: 120,
                    avatar: '🔮',
                    color: 0x8b5cf6,
                    difficulty: 'medium',
                    description: 'A colorful creature that tests your descriptive vocabulary',
                    rewards: { xp: 30, gems: 10 }
                }
            ]
        },
        {
            id: 'grammarGrove',
            name: 'Grammar Grove',
            description: 'A mystical forest where sentence structures grow like trees.',
            icon: '🌳',
            color: 0x3b82f6,
            position: { x: 500, y: 300 },
            unlocked: true,
            level: '3-8',
            activities: ['battle', 'adventure'],
            enemies: [
                {
                    id: 'syntax_sapling',
                    name: 'Syntax Sapling',
                    type: 'grammar',
                    level: 3,
                    health: 120,
                    maxHealth: 120,
                    avatar: '🌱',
                    color: 0x10b981,
                    difficulty: 'medium',
                    description: 'A young tree that tests your basic sentence structure knowledge',
                    rewards: { xp: 30, gems: 10 }
                },
                {
                    id: 'tense_treant',
                    name: 'Tense Treant',
                    type: 'grammar',
                    level: 5,
                    health: 150,
                    maxHealth: 150,
                    avatar: '🌲',
                    color: 0x047857,
                    difficulty: 'medium',
                    description: 'An ancient tree guardian that challenges your understanding of verb tenses',
                    rewards: { xp: 40, gems: 15 }
                }
            ]
        },
        {
            id: 'pronunciationPeaks',
            name: 'Pronunciation Peaks',
            description: 'Majestic mountains where each peak represents a different sound.',
            icon: '⛰️',
            color: 0xef4444,
            position: { x: 200, y: 400 },
            unlocked: false,
            level: '5-10',
            activities: ['battle', 'rhythmGame'],
            enemies: [
                {
                    id: 'vowel_vulture',
                    name: 'Vowel Vulture',
                    type: 'pronunciation',
                    level: 5,
                    health: 140,
                    maxHealth: 140,
                    avatar: '🦅',
                    color: 0xef4444,
                    difficulty: 'medium',
                    description: 'A sharp-eyed bird that tests your vowel pronunciation skills',
                    rewards: { xp: 35, gems: 12 }
                }
            ]
        },
        {
            id: 'idiomIslands',
            name: 'Idiom Islands',
            description: 'A tropical archipelago where each island is a unique English expression.',
            icon: '🏝️',
            color: 0xf59e0b,
            position: { x: 600, y: 450 },
            unlocked: false,
            level: '8-15',
            activities: ['conversation', 'adventure'],
            enemies: []
        }
    ],
    
    questions: {
        vocabulary: {
            easy: [
                {
                    id: 'voc_e_1',
                    question: "What is the correct translation of 'apple'?",
                    options: ["Quả táo", "Quả cam", "Quả chuối", "Quả lê"],
                    correctAnswer: 0,
                    category: 'nouns',
                    points: 10
                },
                {
                    id: 'voc_e_2',
                    question: "Choose the correct meaning of 'happy':",
                    options: ["Buồn", "Mệt mỏi", "Vui vẻ", "Tức giận"],
                    correctAnswer: 2,
                    category: 'adjectives',
                    points: 10
                },
                {
                    id: 'voc_e_3',
                    question: "What does the verb 'run' mean?",
                    options: ["Đi bộ", "Chạy", "Nhảy", "Bơi"],
                    correctAnswer: 1,
                    category: 'verbs',
                    points: 10
                }
            ],
            medium: [
                {
                    id: 'voc_m_1',
                    question: "What does 'eager' mean in Vietnamese?",
                    options: ["Mệt mỏi", "Háo hức", "Buồn chán", "Giận dữ"],
                    correctAnswer: 1,
                    category: 'adjectives',
                    points: 15
                },
                {
                    id: 'voc_m_2',
                    question: "Choose the synonym of 'big':",
                    options: ["Small", "Tiny", "Large", "Little"],
                    correctAnswer: 2,
                    category: 'adjectives',
                    points: 15
                }
            ],
            hard: [
                {
                    id: 'voc_h_1',
                    question: "Choose the synonym of 'magnificent':",
                    options: ["Terrible", "Splendid", "Ordinary", "Small"],
                    correctAnswer: 1,
                    category: 'adjectives',
                    points: 20
                },
                {
                    id: 'voc_h_2',
                    question: "What is the meaning of 'diligent'?",
                    options: ["Lazy", "Careful", "Hardworking", "Intelligent"],
                    correctAnswer: 2,
                    category: 'adjectives',
                    points: 20
                }
            ]
        },
        grammar: {
            easy: [
                {
                    id: 'gram_e_1',
                    question: "Complete the sentence: 'She ___ to the store yesterday.'",
                    options: ["go", "goes", "went", "going"],
                    correctAnswer: 2,
                    category: 'past tense',
                    points: 10
                },
                {
                    id: 'gram_e_2',
                    question: "Select the correct sentence:",
                    options: [
                        "She don't like coffee.",
                        "She doesn't likes coffee.",
                        "She doesn't like coffee.",
                        "She not like coffee."
                    ],
                    correctAnswer: 2,
                    category: 'present tense',
                    points: 10
                }
            ],
            medium: [
                {
                    id: 'gram_m_1',
                    question: "Choose the correct form: 'If I ___ rich, I would buy a mansion.'",
                    options: ["am", "was", "were", "be"],
                    correctAnswer: 2,
                    category: 'conditionals',
                    points: 15
                },
                {
                    id: 'gram_m_2',
                    question: "Select the correct sentence:",
                    options: [
                        "I've been working here since three years.",
                        "I've been working here for three years.",
                        "I've been working here during three years.",
                        "I've been working here by three years."
                    ],
                    correctAnswer: 1,
                    category: 'present perfect',
                    points: 15
                }
            ]
        },
        pronunciation: {
            easy: [
                {
                    id: 'pron_e_1',
                    question: "Which word has a different vowel sound?",
                    options: ["Cat", "Hat", "Mat", "Wait"],
                    correctAnswer: 3,
                    category: 'vowels',
                    points: 10
                }
            ],
            medium: [
                {
                    id: 'pron_m_1',
                    question: "Which word has a different pronunciation pattern?",
                    options: ["Food", "Good", "Mood", "Brood"],
                    correctAnswer: 1,
                    category: 'vowels',
                    points: 15
                }
            ]
        },
        idioms: {
            easy: [
                {
                    id: 'idiom_e_1',
                    question: "What does 'it's raining cats and dogs' mean?",
                    options: ["Animals falling from sky", "Raining heavily", "A strange weather", "A light drizzle"],
                    correctAnswer: 1,
                    category: 'weather idioms',
                    points: 10
                }
            ]
        }
    },
    
    achievements: [
        { 
            id: 'first_victory',
            name: 'First Victory',
            description: 'Win your first battle',
            icon: '🏆',
            reward: { gems: 10, xp: 20 },
            unlocked: false
        },
        { 
            id: 'word_collector',
            name: 'Word Collector',
            description: 'Learn 10 new words',
            icon: '📚',
            reward: { gems: 15, xp: 30 },
            unlocked: false
        },
        { 
            id: 'combo_master',
            name: 'Combo Master',
            description: 'Reach a 5x combo multiplier',
            icon: '🔥',
            reward: { gems: 20, xp: 40 },
            unlocked: false
        }
    ],
    
    shopItems: [
        {
            id: 'health_potion',
            name: 'Health Potion',
            description: 'Restores 50 health points',
            cost: 20,
            icon: '❤️'
        },
        {
            id: 'energy_boost',
            name: 'Energy Boost',
            description: 'Restores 30 energy points',
            cost: 15,
            icon: '⚡'
        },
        {
            id: 'shield_scroll',
            name: 'Shield Scroll',
            description: 'Grants immunity to one attack',
            cost: 25,
            icon: '🛡️'
        },
        {
            id: 'double_damage',
            name: 'Power Rune',
            description: 'Doubles damage for one turn',
            cost: 30,
            icon: '⚔️'
        },
        {
            id: 'hint_book',
            name: 'Hint Book',
            description: 'Provides hints during battles',
            cost: 20,
            icon: '📖'
        }
    ],
    
    dailyRewards: {
        day: 1,
        claimed: false,
        rewards: [
            { day: 1, reward: '10 Gems', icon: '💎', amount: 10 },
            { day: 2, reward: 'Health Potion', icon: '❤️', amount: 1 },
            { day: 3, reward: '25 Gems', icon: '💎', amount: 25 },
            { day: 4, reward: 'Shield Scroll', icon: '🛡️', amount: 1 },
            { day: 5, reward: '50 Gems', icon: '💎', amount: 50 },
            { day: 6, reward: 'Power Rune', icon: '⚔️', amount: 1 },
            { day: 7, reward: '100 Gems', icon: '💎', amount: 100 }
        ]
    },
    
    // Gameplay variables
    battle: {
        currentOpponent: null,
        currentQuestion: null,
        selectedAnswer: null,
        battleState: 'idle', // 'playerTurn', 'monsterTurn', 'victory', 'defeat'
        streak: 0,
        comboMultiplier: 1,
        battleLog: [],
        powerupsActive: {
            shield: false,
            doubleAttack: false,
            hint: false
        },
        timeLeft: 20
    },
    
    // Save game data to localStorage
    saveGame: function() {
        const saveData = {
            player: this.player,
            achievements: this.achievements,
            dailyRewards: this.dailyRewards,
            worldRegions: this.worldRegions.map(region => ({
                id: region.id,
                unlocked: region.unlocked
            }))
        };
        
        localStorage.setItem('wordcraftLegendsData', JSON.stringify(saveData));
    },
    
    // Load game data from localStorage
    loadGame: function() {
        const savedData = localStorage.getItem('wordcraftLegendsData');
        
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Load player data
            this.player = data.player;
            
            // Load achievements
            this.achievements = data.achievements;
            
            // Load daily rewards
            this.dailyRewards = data.dailyRewards;
            
            // Load unlocked regions
            if (data.worldRegions) {
                data.worldRegions.forEach(savedRegion => {
                    const region = this.worldRegions.find(r => r.id === savedRegion.id);
                    if (region) {
                        region.unlocked = savedRegion.unlocked;
                    }
                });
            }
            
            return true;
        }
        
        return false;
    }
};

// js/scenes/BootScene.js - Initial Loading Scene
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }
    
    preload() {
        // Load necessary assets for the loading screen
        this.load.image('logo', 'assets/images/logo.png');
    }
    
    create() {
        // Set up any initial configurations
        this.scale.refresh();
        
        // Check for saved game data
        const hasData = GameData.loadGame();
        
        // Proceed to the preload scene
        this.scene.start('PreloadScene');
    }
}

// js/scenes/PreloadScene.js - Asset Loading Scene
class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }
    
    preload() {
        // Display loading progress
        const progressBar = document.getElementById('progress-fill');
        const loadingText = document.getElementById('loading-text');
        
        this.load.on('progress', (value) => {
            progressBar.style.width = `${Math.round(value * 100)}%`;
            loadingText.innerText = `Loading game assets... ${Math.round(value * 100)}%`;
        });
        
        this.load.on('complete', () => {
            loadingText.innerText = 'Loading complete!';
        });
        
        // Load common assets
        this.load.image('worldmap-bg', 'assets/images/worldmap-bg.png');
        this.load.image('button', 'assets/images/button.png');
        this.load.image('battle-bg', 'assets/images/battle-bg.png');
        
        // UI elements
        this.load.image('panel', 'assets/images/panel.png');
        this.load.image('dialog-bg', 'assets/images/dialog-bg.png');
        
        // Character icons
        this.load.image('wordsmith-icon', 'assets/images/wordsmith-icon.png');
        this.load.image('grammarian-icon', 'assets/images/grammarian-icon.png');
        this.load.image('melodist-icon', 'assets/images/melodist-icon.png');
        this.load.image('sage-icon', 'assets/images/sage-icon.png');
        
        // Region icons
        this.load.image('vocab-village', 'assets/images/vocab-village.png');
        this.load.image('grammar-grove', 'assets/images/grammar-grove.png');
        this.load.image('pronunciation-peaks', 'assets/images/pronunciation-peaks.png');
        this.load.image('idiom-islands', 'assets/images/idiom-islands.png');
        
        // Audio
        this.load.audio('click', 'assets/audio/click.mp3');
        this.load.audio('correct', 'assets/audio/correct.mp3');
        this.load.audio('wrong', 'assets/audio/wrong.mp3');
        this.load.audio('victory', 'assets/audio/victory.mp3');
        this.load.audio('defeat', 'assets/audio/defeat.mp3');
        this.load.audio('main-theme', 'assets/audio/main-theme.mp3');
        this.load.audio('battle-theme', 'assets/audio/battle-theme.mp3');
    }
    
    create() {
        // Hide loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 1000);
        
        // Add sound effects and music to the game
        this.sound.add('click');
        this.sound.add('correct');
        this.sound.add('wrong');
        this.sound.add('victory');
        this.sound.add('defeat');
        
        const music = this.sound.add('main-theme', { 
            loop: true,
            volume: 0.5
        });
        
        // Uncomment to play music
        // music.play();
        
        // Go to intro scene
        this.scene.start('IntroScene');
    }
}

// js/scenes/IntroScene.js - Game Introduction Scene
class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
    }
    
    create() {
        // Background gradient
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create a gradient background
        this.add.graphics()
            .fillGradientStyle(0x3b82f6, 0x3b82f6, 0x1e40af, 0x1e40af, 1)
            .fillRect(0, 0, width, height);
        
        // Title
        this.add.text(width / 2, 100, 'Wordcraft Legends', {
            fontFamily: 'Quicksand',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // Subtitle
        this.add.text(width / 2, 160, 'Master English through epic adventures', {
            fontFamily: 'Quicksand',
            fontSize: '24px',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Feature boxes
        const features = [
            { icon: '⚔️', title: 'Epic Battles', desc: 'Test your knowledge against language monsters' },
            { icon: '⚒️', title: 'Word Crafting', desc: 'Build words from roots, prefixes and suffixes' },
            { icon: '🎵', title: 'Pronunciation', desc: 'Master English sounds with rhythm games' },
            { icon: '🗣️', title: 'Conversation', desc: 'Practice real dialogues with unique characters' }
        ];
        
        features.forEach((feature, index) => {
            const x = 225 + (index % 2) * 450;
            const y = 280 + Math.floor(index / 2) * 120;
            
            // Feature box
            const container = this.add.container(x, y);
            
            // Background with opacity
            const bg = this.add.rectangle(0, 0, 400, 100, 0xffffff, 0.15)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0xffffff, 0.5);
            
            // Icon
            const icon = this.add.text(-170, 0, feature.icon, {
                fontSize: '40px'
            }).setOrigin(0, 0.5);
            
            // Title
            const title = this.add.text(-110, -20, feature.title, {
                fontFamily: 'Quicksand',
                fontSize: '20px',
                fontStyle: 'bold',
                color: '#fff'
            }).setOrigin(0, 0.5);
            
            // Description
            const desc = this.add.text(-110, 15, feature.desc, {
                fontFamily: 'Quicksand',
                fontSize: '16px',
                color: '#fff'
            }).setOrigin(0, 0.5);
            
            container.add([bg, icon, title, desc]);
        });
        
        // Start Button
        const startButton = new Button(
            this, 
            width / 2, 
            height - 100, 
            'Start Your Adventure', 
            { fontSize: '22px', fontStyle: 'bold' },
            () => {
                this.sound.play('click');
                
                if (GameData.player.name && GameData.player.class) {
                    // Player already exists, go to world map
                    this.scene.start('WorldMapScene');
                } else {
                    // New player, go to character selection
                    this.scene.start('CharacterSelectScene');
                }
            },
            280,
            60
        );
        
        // Settings button
        const settingsButton = this.add.image(width - 50, 50, 'button')
            .setDisplaySize(40, 40)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.sound.play('click');
                // TODO: Show settings modal
            });
        
        this.add.text(width - 50, 50, '⚙️', {
            fontSize: '24px'
        }).setOrigin(0.5);
        
        // Version text
        this.add.text(width - 10, height - 10, 'Version 1.0.0', {
            fontFamily: 'Quicksand',
            fontSize: '12px',
            color: '#fff'
        }).setOrigin(1);
    }
}

// js/scenes/CharacterSelectScene.js - Character Selection Scene
class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super('CharacterSelectScene');
    }
    
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background gradient
        this.add.graphics()
            .fillGradientStyle(0x3b82f6, 0x3b82f6, 0x1e40af, 0x1e40af, 1)
            .fillRect(0, 0, width, height);
        
        // Title
        this.add.text(width / 2, 70, 'Create Your Character', {
            fontFamily: 'Quicksand',
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Panel background
        const panel = this.add.rectangle(width / 2, height / 2, 700, 400, 0x000000, 0.5)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff, 0.3);
        
        // Name input field
        this.add.text(width / 2 - 300, height / 2 - 160, 'Your Name:', {
            fontFamily: 'Quicksand',
            fontSize: '20px',
            color: '#fff'
        }).setOrigin(0, 0.5);
        
        // Create HTML input element for name
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Enter your name';
        nameInput.maxLength = 20;
        nameInput.style = `
            width: 250px; 
            padding: 8px 12px; 
            border-radius: 4px; 
            border: none; 
            outline: none; 
            font-family: Quicksand, sans-serif;
            font-size: 16px;
        `;
        
        const nameInputElement = this.add.dom(width / 2, height / 2 - 120).createFromHTML(nameInput);
        nameInputElement.setOrigin(0.5);
        
        // Class selection title
        this.add.text(width / 2, height / 2 - 60, 'Choose Your Class:', {
            fontFamily: 'Quicksand',
            fontSize: '20px',
            color: '#fff'
        }).setOrigin(0.5);
        
        // Class selection
        let selectedClass = null;
        const classContainers = [];
        
        GameData.characterClasses.forEach((charClass, index) => {
            const x = (width / 2 - 260) + (index * 180);
            const y = height / 2 + 50;
            
            const container = this.add.container(x, y);
            container.setSize(150, 180);
            container.setInteractive({ useHandCursor: true });
            
            // Background
            const bg = this.add.rectangle(0, 0, 150, 180, 0xffffff, 0.1)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0xffffff, 0.3);
            
            // Class icon/avatar
            const icon = this.add.text(0, -40, charClass.avatar, {
                fontSize: '48px'
            }).setOrigin(0.5);
            
            // Icon background circle
            const circle = this.add.circle(0, -40, 35, charClass.color, 0.8)
                .setStrokeStyle(2, 0xffffff, 0.8);
            
            // Class name
            const name = this.add.text(0, 20, charClass.name, {
                fontFamily: 'Quicksand',
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#fff'
            }).setOrigin(0.5);
            
            // Class description
            const description = this.add.text(0, 50, charClass.description, {
                fontFamily: 'Quicksand',
                fontSize: '12px',
                color: '#fff',
                wordWrap: { width: 140 },
                align: 'center'
            }).setOrigin(0.5);
            
            container.add([bg, circle, icon, name, description]);
            classContainers.push(container);
            
            // Selection highlight
            const highlight = this.add.rectangle(0, 0, 150, 180, 0x3b82f6, 0)
                .setOrigin(0.5)
                .setStrokeStyle(3, 0x3b82f6, 0);
            
            container.add(highlight);
            
            // Click handling
            container.on('pointerdown', () => {
                this.sound.play('click');
                
                // Clear previous selection
                classContainers.forEach(c => {
                    c.getAt(c.length - 1).setStrokeStyle(3, 0x3b82f6, 0);
                });
                
                // Highlight this selection
                highlight.setStrokeStyle(3, 0x3b82f6, 1);
                
                // Store selected class
                selectedClass = charClass.id;
            });
        });
        
        // Start Button (initially disabled)
        const startButton = new Button(
            this, 
            width / 2, 
            height - 80, 
            'Begin Your Journey', 
            { fontSize: '22px', fontStyle: 'bold' },
            () => {
                const name = nameInput.value.trim();
                
                if (name && selectedClass) {
                    this.sound.play('click');
                    
                    // Set player info
                    GameData.player.name = name;
                    GameData.player.class = selectedClass;
                    
                    // Set avatar based on class
                    const selectedClassData = GameData.characterClasses.find(c => c.id === selectedClass);
                    if (selectedClassData) {
                        GameData.player.avatar = selectedClassData.avatar;
                    }
                    
                    // Save game data
                    GameData.saveGame();
                    
                    // Go to world map
                    this.scene.start('WorldMapScene');
                }
            },
            280,
            60
        );
        
        startButton.disable();
        
        // Enable/disable start button based on inputs
        this.time.addEvent({
            delay: 200,
            callback: () => {
                const name = nameInput.value.trim();
                
                if (name && selectedClass) {
                    startButton.enable();
                } else {
                    startButton.disable();
                }
            },
            loop: true
        });
    }
}

// js/scenes/WorldMapScene.js - World Map Navigation Scene
class WorldMapScene extends Phaser.Scene {
    constructor() {
        super('WorldMapScene');
    }
    
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background with a fantasy map style
        this.add.rectangle(0, 0, width, height, 0x1e3a8a).setOrigin(0);
        
        // Map details
        this.add.graphics()
            .lineStyle(2, 0xffffff, 0.3)
            .strokeRoundedRect(100, 100, width - 200, height - 200, 16);
        
        // Player Info Panel (top)
        const playerPanel = this.add.rectangle(width / 2, 50, width - 40, 80, 0x000000, 0.7)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff, 0.5);
            
        // Player avatar and name
        const avatarCircle = this.add.circle(70, 50, 30, 0x3b82f6, 1)
            .setStrokeStyle(2, 0xffffff, 0.8);
            
        this.add.text(70, 50, GameData.player.avatar, { 
            fontSize: '32px' 
        }).setOrigin(0.5);
        
        this.add.text(120, 40, GameData.player.name, {
            fontFamily: 'Quicksand',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0, 0.5);
        
        // Class and level
        const playerClass = GameData.characterClasses.find(c => c.id === GameData.player.class);
        this.add.text(120, 65, `Level ${GameData.player.level} ${playerClass ? playerClass.name : ''}`, {
            fontFamily: 'Quicksand',
            fontSize: '16px',
            color: '#ccc'
        }).setOrigin(0, 0.5);
        
        // Player stats
        const statsX = width - 200;
        
        // Gems counter
        this.add.text(statsX, 40, '💎', { 
            fontSize: '24px' 
        }).setOrigin(0.5);
        
        this.add.text(statsX + 30, 40, `${GameData.player.inventory.gems}`, {
            fontFamily: 'Quicksand',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0, 0.5);
        
        // Score counter
        this.add.text(statsX + 100, 40, '🏆', { 
            fontSize: '24px' 
        }).setOrigin(0.5);
        
        this.add.text(statsX + 130, 40, `${GameData.player.score}`, {
            fontFamily: 'Quicksand',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0, 0.5);
        
        // XP Bar
        this.add.text(width / 2 - 80, 65, 'XP:', {
            fontFamily: 'Quicksand',
            fontSize: '16px',
            color: '#fff'
        }).setOrigin(0, 0.5);
        
        const xpNeeded = GameData.player.level * 100;
        this.xpBar = new ProgressBar(
            this,
            width / 2 - 40,
            65,
            200,
            15,
            GameData.player.experience,
            xpNeeded,
            0x4f46e5
        );
        
        this.add.text(width / 2 + 180, 65, `${GameData.player.experience}/${xpNeeded}`, {
            fontFamily: 'Quicksand',
            fontSize: '14px',
            color: '#ccc'
        }).setOrigin(0, 0.5);
        
        // Regions
        GameData.worldRegions.forEach(region => {
            // Region circle
            const circle = this.add.circle(region.position.x, region.position.y, 40, region.color, 0.8)
                .setStrokeStyle(3, 0xffffff, 0.8);
            
            // Add icon
            this.add.text(region.position.x, region.position.y, region.icon, {
                fontSize: '32px'
            }).setOrigin(0.5);
            
            // Region name
            this.add.text(region.position.x, region.position.y + 55, region.name, {
                fontFamily: 'Quicksand',
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#fff',
                stroke: '#000',
                strokeThickness: 4
            }).setOrigin(0.5);
            
            // Level indicator
            this.add.text(region.position.x, region.position.y + 75, `Level ${region.level}`, {
                fontFamily: 'Quicksand',
                fontSize: '12px',
                color: '#ddd',
                stroke: '#000',
                strokeThickness: 3
            }).setOrigin(0.5);
            
            // Make clickable if unlocked
            if (region.unlocked) {
                const hitArea = this.add.circle(region.position.x, region.position.y, 50, 0xffffff, 0)
                    .setInteractive({ useHandCursor: true });
                
                // Hover effect
                hitArea.on('pointerover', () => {
                    circle.setStrokeStyle(4, 0xffffff, 1);
                    circle.setScale(1.1);
                });
                
                hitArea.on('pointerout', () => {
                    circle.setStrokeStyle(3, 0xffffff, 0.8);
                    circle.setScale(1);
                });
                
                // Click to select region
                hitArea.on('pointerdown', () => {
                    this.sound.play('click');
                    this.showRegionDetails(region);
                });
            } else {
                // Show locked status
                circle.setFillStyle(region.color, 0.3);
                
                const lock = this.add.text(region.position.x, region.position.y, '🔒', {
                    fontSize: '24px'
                }).setOrigin(0.5);
            }
        });
        
        // Player marker
        const playerPos = GameData.worldRegions.find(r => r.id === 'vocabVillage').position;
        this.playerMarker = this.add.container(playerPos.x, playerPos.y);
        
        const markerCircle = this.add.circle(0, 0, 20, 0xfacc15, 1)
            .setStrokeStyle(2, 0xffffff, 1);
            
        const markerAvatar = this.add.text(0, 0, GameData.player.avatar, {
            fontSize: '20px'
        }).setOrigin(0.5);
        
        this.playerMarker.add([markerCircle, markerAvatar]);
        
        // Add marker pulse animation
        this.tweens.add({
            targets: markerCircle,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0.7,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        // Add shop button
        const shopButton = new Button(
            this,
            width - 100,
            height - 60,
            'Shop',
            { fontFamily: 'Quicksand', fontSize: '18px' },
            () => {
                this.sound.play('click');
                // TODO: Show shop
                Utils.showToast(this, 'Shop will be available in the next update!');
            },
            120,
            50
        );
        
        // Add quest button
        const questButton = new Button(
            this,
            width - 230,
            height - 60,
            'Quests',
            { fontFamily: 'Quicksand', fontSize: '18px' },
            () => {
                this.sound.play('click');
                // TODO: Show quests
                Utils.showToast(this, 'Quests will be available in the next update!');
            },
            120,
            50
        );
    }
    
    showRegionDetails(region) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // If there's already a panel, destroy it
        if (this.regionPanel) {
            this.regionPanel.destroy(true);
        }
        
        // Create a panel for region details
        this.regionPanel = this.add.container(width / 2, height - 120);
        
        // Panel background
        const panel = this.add.rectangle(0, 0, 600, 160, 0x000000, 0.8)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff, 0.5);
        
        // Close button
        const closeButton = this.add.text(290, -70, '✕', {
            fontSize: '20px',
            color: '#fff'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.sound.play('click');
            this.regionPanel.destroy(true);
            this.regionPanel = null;
        });
        
        // Region info
        const icon = this.add.text(-260, -50, region.icon, {
            fontSize: '40px'
        }).setOrigin(0.5);
        
        const iconBg = this.add.circle(-260, -50, 30, region.color, 0.8)
            .setStrokeStyle(2, 0xffffff, 0.8);
        
        // Region name and description
        const name = this.add.text(-210, -50, region.name, {
            fontFamily: 'Quicksand',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0, 0.5);
        
        const description = this.add.text(-210, -15, region.description, {
            fontFamily: 'Quicksand',
            fontSize: '16px',
            color: '#ddd',
            wordWrap: { width: 450 }
        }).setOrigin(0, 0.5);
        
        // Activities section
        const activitiesTitle = this.add.text(-250, 20, 'Available Activities:', {
            fontFamily: 'Quicksand',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0, 0.5);
        
        // Activity buttons
        const activities = [];
        region.activities.forEach((activity, index) => {
            let icon, title;
            
            switch(activity) {
                case 'battle':
                    icon = '⚔️';
                    title = 'Battle';
                    break;
                case 'conversation':
                    icon = '🗣️';
                    title = 'Conversation';
                    break;
                case 'craft':
                    icon = '⚒️';
                    title = 'Word Crafting';
                    break;
                case 'rhythmGame':
                    icon = '🎵';
                    title = 'Pronunciation';
                    break;
                case 'adventure':
                    icon = '🗺️';
                    title = 'Adventure';
                    break;
                default:
                    icon = '❓';
                    title = activity;
            }
            
            const activityButton = new Button(
                this,
                -250 + (index * 150),
                60,
                `${icon} ${title}`,
                { fontSize: '14px' },
                () => {
                    this.sound.play('click');
                    
                    // Store selected region in game data
                    GameData.selectedRegion = region;
                    
                    // Start the corresponding activity
                    switch(activity) {
                        case 'battle':
                            this.scene.start('BattleScene');
                            break;
                        case 'conversation':
                            Utils.showToast(this, 'Conversation mode coming soon!');
                            break;
                        case 'craft':
                            Utils.showToast(this, 'Word Crafting mode coming soon!');
                            break;
                        case 'rhythmGame':
                            Utils.showToast(this, 'Pronunciation Rhythm game coming soon!');
                            break;
                        case 'adventure':
                            Utils.showToast(this, 'Adventure mode coming soon!');
                            break;
                    }
                },
                140,
                40
            );
            
            activities.push(activityButton);
        });
        
        // Add everything to the panel
        this.regionPanel.add([panel, closeButton, iconBg, icon, name, description, activitiesTitle, ...activities]);
        
        // Animation for panel appearance
        this.regionPanel.setScale(0.9);
        this.regionPanel.alpha = 0;
        
        this.tweens.add({
            targets: this.regionPanel,
            scale: 1,
            alpha: 1,
            duration: 200,
            ease: 'Power2'
        });
    }
}

// js/scenes/BattleScene.js - Battle Gameplay Scene
class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
        
        this.timer = null;
        this.timeLeft = 20;
        this.currentEnemy = null;
        this.currentQuestion = null;
        this.selectedAnswer = null;
        this.battleState = 'init'; // 'init', 'playerTurn', 'monsterTurn', 'victory', 'defeat'
        this.streak = 0;
        this.comboMultiplier = 1;
        this.battleLogs = [];
        
        // Powerups active
        this.powerupsActive = {
            shield: false,
            doubleAttack: false,
            hint: false
        };
    }
    
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Set up battle music
        this.battleMusic = this.sound.add('battle-theme', { 
            loop: true,
            volume: 0.4
        });
        
        // Uncomment to play battle music
        // this.battleMusic.play();
        
        // Cache sound effects
        this.sounds = {
            correct: this.sound.add('correct'),
            wrong: this.sound.add('wrong'),
            victory: this.sound.add('victory'),
            defeat: this.sound.add('defeat'),
            click: this.sound.add('click')
        };
        
        // Background
        this.add.rectangle(0, 0, width, height, 0x1e293b).setOrigin(0);
        
        // Header
        this.header = this.add.container(width / 2, 40);
        
        const headerBg = this.add.rectangle(0, 0, width - 40, 60, 0x000000, 0.6)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0xffffff, 0.3);
            
        // Back button
        const backButton = this.add.text(-width / 2 + 30, 0, '← Back to Map', {
            fontFamily: 'Quicksand',
            fontSize: '16px',
            color: '#fff'
        })
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.sounds.click.play();
            
            // Clean up and stop timer
            if (this.timer) {
                this.timer.remove();
            }
            
            // Stop battle music
            if (this.battleMusic && this.battleMusic.isPlaying) {
                this.battleMusic.stop();
            }
            
            this.scene.start('WorldMapScene');
        });
        
        // Title
        const title = this.add.text(0, -10, 'Battle Mode', {
            fontFamily: 'Quicksand',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5);
        
        const subtitle = this.add.text(0, 15, GameData.selectedRegion.name, {
            fontFamily: 'Quicksand',
            fontSize: '14px',
            color: '#ccc'
        }).setOrigin(0.5);
        
        // Items button
        const itemsButton = this.add.text(width / 2 - 80, 0, '🎒 Items', {
            fontFamily: 'Quicksand',
            fontSize: '16px',
            color: '#fff',
            backgroundColor: '#111',
            padding: { x: 10, y: 5 }
        })
        .setOrigin(1, 0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.sounds.click.play();
            this.showItemsPanel();
        });
        
        this.header.add([headerBg, backButton, title, subtitle, itemsButton]);
        
        // Health bars
        this.playerHealth = new HealthBar(
            this,
            width / 4,
            100,
            200,
            20,
            GameData.player.health,
            GameData.player.maxHealth
        );
        
        // Battle arena
        this.battleArena = this.add.container(width / 2, height / 2 - 20);
        
        const arenaBg = this.add.rectangle(0, 0, width - 80, 200, 0x1e3a8a, 0.5)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x3b82f6, 0.5);
            
        this.battleArena.add(arenaBg);
        
        // Player character
        this.playerContainer = this.add.container(-200, 0);
        
        const playerClass = GameData.characterClasses.find(c => c.id === GameData.player.class);
        const playerCircle = this.add.circle(0, 0, 50, playerClass ? playerClass.color : 0x3b82f6, 0.9)
            .setStrokeStyle(3, 0xffffff, 0.9);
            
        const playerAvatar = this.add.text(0, 0, GameData.player.avatar, {
            fontSize: '48px'
        }).setOrigin(0.5);
        
        const playerName = this.add.text(0, 70, GameData.player.name, {
            fontFamily: 'Quicksand',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Combo indicator
        this.comboText = this.add.text(40, -40, '', {
            fontFamily: 'Quicksand',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#fbbf24',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5)
        .setVisible(false);
        
        this.playerContainer.add([playerCircle, playerAvatar, playerName, this.comboText]);
        this.battleArena.add(this.playerContainer);
        
        // Select a random enemy from the region
        if (GameData.selectedRegion.enemies && GameData.selectedRegion.enemies.length > 0) {
            const enemyOptions = GameData.selectedRegion.enemies;
            this.currentEnemy = {...enemyOptions[Math.floor(Math.random() * enemyOptions.length)]};
            
            // Clone to avoid modifying original data
            this.currentEnemy.health = this.currentEnemy.maxHealth;
            
            // Create enemy health bar
            this.enemyHealth = new HealthBar(
                this,
                3 * width / 4,
                100,
                200,
                20,
                this.currentEnemy.health,
                this.currentEnemy.maxHealth
            );
            
            // Enemy character
            this.enemyContainer = this.add.container(200, 0);
            
            const enemyCircle = this.add.circle(0, 0, 50, this.currentEnemy.color, 0.9)
                .setStrokeStyle(3, 0xffffff, 0.9);
                
            const enemyAvatar = this.add.text(0, 0, this.currentEnemy.avatar, {
                fontSize: '48px'
            }).setOrigin(0.5);
            
            const enemyName = this.add.text(0, 70, this.currentEnemy.name, {
                fontFamily: 'Quicksand',
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#fff',
                stroke: '#000',
                strokeThickness: 3
            }).setOrigin(0.5);
            
            // Level indicator
            const levelTag = this.add.container(-40, -40);
            
            const levelBg = this.add.rectangle(0, 0, 50, 24, 0xef4444, 0.9)
                .setOrigin(0.5)
                .setStrokeStyle(1, 0xffffff, 0.7);
                
            const levelText = this.add.text(0, 0, `Lv.${this.currentEnemy.level}`, {
                fontFamily: 'Quicksand',
                fontSize: '12px',
                fontStyle: 'bold',
                color: '#fff'
            }).setOrigin(0.5);
            
            levelTag.add([levelBg, levelText]);
            
            this.enemyContainer.add([enemyCircle, enemyAvatar, enemyName, levelTag]);
            this.battleArena.add(this.enemyContainer);
        } else {
            // No enemies available error
            this.add.text(width / 2, height / 2, 'No enemies available in this region', {
                fontFamily: 'Quicksand',
                fontSize: '20px',
                color: '#fff'
            }).setOrigin(0.5);
            
            return;
        }
        
        // Timer display (initially hidden)
        this.timerDisplay = this.add.container(width / 2, 120);
        
        this.timerCircle = this.add.circle(0, 0, 30, 0x10b981, 1)
            .setStrokeStyle(3, 0xffffff, 0.9);
            
        this.timerText = this.add.text(0, 0, '20', {
            fontFamily: 'Quicksand',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5);
        
        this.timerDisplay.add([this.timerCircle, this.timerText]);
        this.timerDisplay.setVisible(false);
        
        // Battle log
        this.battleLog = this.add.container(width / 2, height - 200);
        
        const logBg = this.add.rectangle(0, 0, width - 80, 100, 0x000000, 0.7)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0xffffff, 0.3);
            
        const logTitle = this.add.text(-width / 2 + 60, -40, 'Battle Log', {
            fontFamily: 'Quicksand',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#fff'
        });
        
        this.logTextContainer = this.add.container(0, 0);
        
        this.battleLog.add([logBg, logTitle, this.logTextContainer]);
        
        // Question container (initially hidden)
        this.questionContainer = this.add.container(width / 2, height - 80);
        
        const questionBg = this.add.rectangle(0, -60, width - 80, 180, 0xffffff, 0.05)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0xffffff, 0.2);
            
        this.questionText = this.add.text(0, -130, '', {
            fontFamily: 'Quicksand',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff',
            wordWrap: { width: width - 120 },
            align: 'center'
        }).setOrigin(0.5);
        
        // Points indicator
        this.pointsTag = this.add.container(width / 2 - 80, height - 210);
        
        this.pointsBg = this.add.rectangle(0, 0, 60, 24, 0x10b981, 0.9)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0xffffff, 0.7);
            
        this.pointsText = this.add.text(0, 0, '10 pts', {
            fontFamily: 'Quicksand',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5);
        
        this.pointsTag.add([this.pointsBg, this.pointsText]);
        this.pointsTag.setVisible(false);
        
        // Answer options
        this.answerButtons = [];
        
        this.questionContainer.add(questionBg);
        this.questionContainer.add(this.questionText);
        this.questionContainer.setVisible(false);
        
        // Powerups indicator
        this.powerupsIndicator = this.add.container(width / 2, 180);
        this.updatePowerupsIndicator();
        
        // Start battle sequence
        this.startBattle();
    }
    
    startBattle() {
        // Battle intro animation
        this.cameras.main.flash(500, 255, 255, 255, true);
        
        this.addBattleLog('system', `Battle with ${this.currentEnemy.name} has begun!`);
        
        // Set battle state to player's turn
        this.battleState = 'playerTurn';
        
        // Start with a question
        this.nextQuestion();
    }
    
    nextQuestion() {
        // Clear previous answer buttons
        this.answerButtons.forEach(button => button.destroy());
        this.answerButtons = [];
        
        // Get a random question based on enemy type
        const enemyType = this.currentEnemy.type || 'vocabulary';
        const difficulty = this.currentEnemy.difficulty || 'easy';
        
        // Find questions for this type and difficulty
        const availableQuestions = GameData.questions[enemyType]?.[difficulty];
        
        // Fallback if not found
        if (!availableQuestions || availableQuestions.length === 0) {
            this.currentQuestion = GameData.questions.vocabulary.easy[0];
        } else {
            // Random question
            this.currentQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        }
        
        // Update points indicator
        this.pointsText.setText(`${this.currentQuestion.points} pts`);
        this.pointsBg.fillColor = this.currentQuestion.points <= 10 ? 0x10b981 : this.currentQuestion.points <= 15 ? 0xfacc15 : 0xef4444;
        this.pointsTag.setVisible(true);
        
        // Display question
        this.questionText.setText(this.currentQuestion.question);
        
        // Create answer buttons
        const optionLetters = ['A', 'B', 'C', 'D'];
        const buttonWidth = 350;
        const numOptions = this.currentQuestion.options.length;
        const rows = numOptions <= 2 ? 1 : 2;
        const cols = numOptions <= 2 ? numOptions : 2;
        
        for (let i = 0; i < numOptions; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            const x = (col === 0 ? -1 : 1) * (buttonWidth / 2 + 10);
            const y = -40 + (row * 70);
            
            const button = this.add.container(x, y);
            button.setSize(buttonWidth, 60);
            button.setInteractive({ useHandCursor: true });
            
            // Button background
            const bg = this.add.rectangle(0, 0, buttonWidth, 60, 0xffffff, 0.1)
                .setOrigin(0.5)
                .setStrokeStyle(1, 0xffffff, 0.5);
                
            // Option letter
            const letter = this.add.container(-buttonWidth / 2 + 25, 0);
            
            const letterBg = this.add.circle(0, 0, 15, 0x6b7280, 0.8);
            
            const letterText = this.add.text(0, 0, optionLetters[i], {
                fontFamily: 'Quicksand',
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#fff'
            }).setOrigin(0.5);
            
            letter.add([letterBg, letterText]);
            
            // Answer text
            const text = this.add.text(-buttonWidth / 2 + 50, 0, this.currentQuestion.options[i], {
                fontFamily: 'Quicksand',
                fontSize: '18px',
                color: '#fff',
                wordWrap: { width: buttonWidth - 80 }
            }).setOrigin(0, 0.5);
            
            button.add([bg, letter, text]);
            
            // Store index for reference
            button.optionIndex = i;
            
            // Handle clicks
            button.on('pointerdown', () => {
                this.sounds.click.play();
                
                if (this.battleState === 'playerTurn' && this.selectedAnswer === null) {
                    this.handleAnswer(i);
                }
            });
            
            // Hover effects
            button.on('pointerover', () => {
                bg.setFillStyle(0xffffff, 0.2);
            });
            
            button.on('pointerout', () => {
                bg.setFillStyle(0xffffff, 0.1);
            });
            
            this.answerButtons.push(button);
            this.questionContainer.add(button);
        }
        
        // Show the question container
        this.questionContainer.setVisible(true);
        
        // Start timer
        this.startTimer();
        
        // Show turn indicator
        this.showTurnIndicator('player');
    }
    
    startTimer() {
        // Reset timer
        this.timeLeft = 20;
        this.timerText.setText(this.timeLeft.toString());
        this.timerCircle.fillColor = 0x10b981;
        this.timerDisplay.setVisible(true);
        
        // Clear existing timer
        if (this.timer) {
            this.timer.remove();
        }
        
        // Create new timer
        this.timer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeLeft--;
                this.timerText.setText(this.timeLeft.toString());
                
                // Change color based on time left
                if (this.timeLeft <= 5) {
                    this.timerCircle.fillColor = 0xef4444;
                    
                    // Add pulsing effect when time is running out
                    if (!this.timerPulse) {
                        this.timerPulse = this.tweens.add({
                            targets: this.timerDisplay,
                            scale: 1.2,
                            duration: 300,
                            yoyo: true,
                            repeat: -1
                        });
                    }
                } else if (this.timeLeft <= 10) {
                    this.timerCircle.fillColor = 0xfacc15;
                    
                    // Stop pulsing if it was active
                    if (this.timerPulse) {
                        this.timerPulse.stop();
                        this.timerPulse = null;
                        this.timerDisplay.setScale(1);
                    }
                }
                
                // Time's up
                if (this.timeLeft <= 0) {
                    // Stop timer and pulsing
                    this.timer.remove();
                    
                    if (this.timerPulse) {
                        this.timerPulse.stop();
                        this.timerDisplay.setScale(1);
                        this.timerPulse = null;
                    }
                    
                    // If no answer selected, treat as wrong answer
                    if (this.selectedAnswer === null) {
                        // Generate a random wrong answer
                        const wrongOptions = Array.from({length: this.currentQuestion.options.length})
                            .map((_, i) => i)
                            .filter(i => i !== this.currentQuestion.correctAnswer);
                        
                        const randomWrong = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
                        
                        this.handleAnswer(randomWrong);
                    }
                }
            },
            callbackScope: this,
            loop: true
        });
    }
    
    stopTimer() {
        if (this.timer) {
            this.timer.remove();
            this.timer = null;
        }
        
        if (this.timerPulse) {
            this.timerPulse.stop();
            this.timerDisplay.setScale(1);
            this.timerPulse = null;
        }
        
        this.timerDisplay.setVisible(false);
    }
    
    handleAnswer(answerIndex) {
        // Stop the timer
        this.stopTimer();
        
        // Store the selected answer
        this.selectedAnswer = answerIndex;
        
        // Update button appearance
        this.answerButtons.forEach((button, index) => {
            const bg = button.getAt(0);
            const letter = button.getAt(1).getAt(0);
            
            if (index === this.currentQuestion.correctAnswer) {
                // Correct answer styling
                bg.setFillStyle(0x10b981, 0.6);
                bg.setStrokeStyle(2, 0x10b981, 1);
                letter.fillColor = 0x10b981;
                
                // Add checkmark icon
                const check = this.add.text(button.width / 2 - 30, 0, '✓', {
                    fontSize: '24px',
                    color: '#10b981'
                }).setOrigin(0.5);
                
                button.add(check);
            } else if (index === answerIndex && index !== this.currentQuestion.correctAnswer) {
                // Wrong answer styling
                bg.setFillStyle(0xef4444, 0.6);
                bg.setStrokeStyle(2, 0xef4444, 1);
                letter.fillColor = 0xef4444;
            }
            
            // Disable all buttons
            button.disableInteractive();
        });
        
        // Check if the answer is correct
        if (answerIndex === this.currentQuestion.correctAnswer) {
            // Correct answer
            this.sounds.correct.play();
            
            // Calculate damage
            const timeBonus = Math.max(0, this.timeLeft / 20);
            const baseDamage = 15 + Math.floor(Math.random() * 5);
            let damage = Math.round(baseDamage * this.comboMultiplier * (1 + timeBonus));
            
            // Apply powerups
            if (this.powerupsActive.doubleAttack) {
                damage *= 2;
                this.powerupsActive.doubleAttack = false;
                this.updatePowerupsIndicator();
                Utils.showToast(this, 'Double Attack activated!');
            }
            
            // Special ability for Wordsmith class (critical hit chance)
            let isCritical = false;
            if (GameData.player.class === 'wordsmith' && Math.random() < 0.2) {
                damage *= 2;
                isCritical = true;
                this.addBattleLog('player_critical', 'Critical hit! Double damage!');
                
                // Flash effect for critical
                this.cameras.main.flash(300, 255, 255, 0, true);
            }
            
            // Update enemy health
            const newHealth = Math.max(0, this.currentEnemy.health - damage);
            this.updateEnemyHealth(newHealth);
            
            // Add floating damage text
            const damageText = isCritical ? `CRITICAL!\n-${damage}` : `-${damage}`;
            const damageColor = isCritical ? '#fbbf24' : '#ef4444';
            Utils.addFloatingText(this, this.enemyContainer.x + this.battleArena.x, this.enemyContainer.y + this.battleArena.y - 80, damageText, {
                fontSize: isCritical ? '28px' : '24px',
                color: damageColor,
                stroke: '#000',
                strokeThickness: 4,
                align: 'center'
            });
            
            // Player attack animation
            this.playerAttackAnimation();
            
            // Add to battle log
            this.addBattleLog('player_attack', `You dealt ${damage} damage with a ${this.comboMultiplier.toFixed(1)}x combo!`);
            
            // Update streak and combo
            this.streak++;
            
            // Different combo increase rate based on class
            const comboIncrease = GameData.player.class === 'melodist' ? 0.625 : 0.5;
            this.comboMultiplier = Math.min(5, this.comboMultiplier + comboIncrease);
            
            // Update combo display
            if (this.streak >= 3) {
                this.comboText.setText(`${this.comboMultiplier.toFixed(1)}x`);
                this.comboText.setVisible(true);
            }
            
            // Add to score and player progress
            GameData.player.score += this.currentQuestion.points * this.comboMultiplier;
            GameData.player.progress.wordsLearned++;
            
            // Check for victory
            if (newHealth <= 0) {
                this.handleVictory();
                return;
            }
        } else {
            // Wrong answer
            this.sounds.wrong.play();
            
            // Reset streak and combo
            this.streak = 0;
            this.comboMultiplier = 1;
            this.comboText.setVisible(false);
            
            // Add to battle log
            this.addBattleLog('player_miss', `Wrong answer! The correct answer was: "${this.currentQuestion.options[this.currentQuestion.correctAnswer]}"`);
        }
        
        // Show message
        const messageText = answerIndex === this.currentQuestion.correctAnswer ? 
            `Correct! +${this.currentQuestion.points} points` : 
            'Incorrect! Try again next time';
        
        const messageColor = answerIndex === this.currentQuestion.correctAnswer ? '#10b981' : '#ef4444';
        
        this.showMessage(messageText, messageColor);
        
        // Proceed to monster's turn after delay
        this.time.delayedCall(1500, this.monsterTurn, [], this);
    }
    
    monsterTurn() {
        // Set battle state
        this.battleState = 'monsterTurn';
        
        // Hide question container
        this.questionContainer.setVisible(false);
        this.pointsTag.setVisible(false);
        
        // Show turn indicator
        this.showTurnIndicator('monster');
        
        // Show message
        this.showMessage(`${this.currentEnemy.name} is attacking!`, '#ef4444');
        
        // Monster attacks after delay
        this.time.delayedCall(1200, () => {
            // Calculate monster damage
            const baseDamage = 5 + Math.floor(Math.random() * 5) + Math.floor(this.currentEnemy.level / 2);
            let finalDamage = baseDamage;
            
            // Check for blocking
            let blocked = false;
            
            // Special ability for Grammarian class (shield chance)
            if (GameData.player.class === 'grammarian' && Math.random() < 0.25) {
                blocked = true;
                Utils.addFloatingText(this, this.playerContainer.x + this.battleArena.x, this.playerContainer.y + this.battleArena.y - 60, 'BLOCKED!', {
                    fontSize: '24px',
                    color: '#3b82f6',
                    stroke: '#000',
                    strokeThickness: 4
                });
                
                this.addBattleLog('player_block', 'You blocked the attack with your Sentence Shield!');
            }
            
            // Shield powerup
            if (this.powerupsActive.shield) {
                blocked = true;
                this.powerupsActive.shield = false;
                this.updatePowerupsIndicator();
                
                Utils.addFloatingText(this, this.playerContainer.x + this.battleArena.x, this.playerContainer.y + this.battleArena.y - 60, 'SHIELD!', {
                    fontSize: '24px',
                    color: '#3b82f6',
                    stroke: '#000',
                    strokeThickness: 4
                });
                
                this.addBattleLog('player_shield', 'Your Shield Scroll absorbed the attack!');
                Utils.showToast(this, 'Shield activated!');
            }
            
            if (!blocked) {
                // Apply damage to player
                const newHealth = Math.max(0, GameData.player.health - finalDamage);
                this.updatePlayerHealth(newHealth);
                
                // Add floating damage text
                Utils.addFloatingText(this, this.playerContainer.x + this.battleArena.x, this.playerContainer.y + this.battleArena.y - 60, `-${finalDamage}`, {
                    fontSize: '24px',
                    color: '#ef4444',
                    stroke: '#000',
                    strokeThickness: 4
                });
                
                // Monster attack animation
                this.monsterAttackAnimation();
                
                // Shake camera for impact
                Utils.shakeCamera(this, 0.01, 200);
                
                // Add to battle log
                this.addBattleLog('monster_attack', `${this.currentEnemy.name} dealt ${finalDamage} damage to you!`);
                
                // Check for defeat
                if (newHealth <= 0) {
                    this.handleDefeat();
                    return;
                }
            }
            
            // Return to player turn after delay
            this.time.delayedCall(1500, () => {
                // Clear selected answer
                this.selectedAnswer = null;
                
                // Set battle state
                this.battleState = 'playerTurn';
                
                // Get next question
                this.nextQuestion();
            }, [], this);
        }, [], this);
    }
    
   // Continuing from the previous code...

// Completing the handleVictory function in BattleScene
handleVictory() {
    // Play victory sound
    this.sounds.victory.play();
    
    // Set battle state
    this.battleState = 'victory';
    
    // Hide question container
    this.questionContainer.setVisible(false);
    this.pointsTag.setVisible(false);
    
    // Hide turn indicators
    this.showTurnIndicator(null);
    
    // Add to battle log
    this.addBattleLog('victory', `You defeated ${this.currentEnemy.name}!`);
    
    // Flash effect
    this.cameras.main.flash(500, 255, 255, 255, true);
    
    // Show victory animation
    const victoryText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, 'VICTORY!', {
        fontFamily: 'Quicksand',
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#10b981',
        stroke: '#000',
        strokeThickness: 6,
        align: 'center'
    }).setOrigin(0.5);
    
    // Add shine animation to victory text
    this.tweens.add({
        targets: victoryText,
        alpha: { start: 0, to: 1 },
        scale: { start: 0.5, to: 1 },
        ease: 'Power2',
        duration: 1000
    });
    
    // Give rewards
    const xpReward = this.currentEnemy.rewards.xp;
    const gemReward = this.currentEnemy.rewards.gems;
    
    // Add to player's inventory
    GameData.player.inventory.gems += gemReward;
    
    // Add XP
    this.addExperience(xpReward);
    
    // Update player progress
    GameData.player.progress.battlesWon++;
    
    // Check for achievements
    this.checkAchievements();
    
    // Show rewards after a delay
    this.time.delayedCall(1500, () => {
        this.showRewards(xpReward, gemReward);
    }, [], this);
    
    // Save game data
    GameData.saveGame();
}

handleDefeat() {
    // Play defeat sound
    this.sounds.defeat.play();
    
    // Set battle state
    this.battleState = 'defeat';
    
    // Hide question container
    this.questionContainer.setVisible(false);
    this.pointsTag.setVisible(false);
    
    // Hide turn indicators
    this.showTurnIndicator(null);
    
    // Add to battle log
    this.addBattleLog('defeat', `You were defeated by ${this.currentEnemy.name}!`);
    
    // Flash effect in red
    this.cameras.main.flash(500, 255, 0, 0, true);
    
    // Show defeat animation
    const defeatText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, 'DEFEAT!', {
        fontFamily: 'Quicksand',
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#ef4444',
        stroke: '#000',
        strokeThickness: 6,
        align: 'center'
    }).setOrigin(0.5);
    
    this.tweens.add({
        targets: defeatText,
        alpha: { start: 0, to: 1 },
        scale: { start: 0.5, to: 1 },
        ease: 'Power2',
        duration: 1000
    });
    
    // Give some consolation XP (25% of what you'd get for winning)
    const xpReward = Math.floor(this.currentEnemy.rewards.xp * 0.25);
    this.addExperience(xpReward);
    
    // Show retry button after delay
    this.time.delayedCall(1500, () => {
        this.showDefeatScreen(xpReward);
    }, [], this);
    
    // Save game data
    GameData.saveGame();
}

showRewards(xp, gems) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create reward panel
    this.rewardPanel = this.add.container(width / 2, height / 2);
    
    // Panel background
    const panel = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.8)
        .setOrigin(0.5)
        .setStrokeStyle(2, 0xffffff, 0.5);
    
    // Panel title
    const title = this.add.text(0, -120, 'Victory Rewards', {
        fontFamily: 'Quicksand',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#fff'
    }).setOrigin(0.5);
    
    // Trophy icon
    const trophy = this.add.text(0, -80, '🏆', {
        fontSize: '40px'
    }).setOrigin(0.5);
    
    // Reward details
    const xpContainer = this.add.container(-80, 0);
    const xpBg = this.add.rectangle(0, 0, 150, 100, 0x3b82f6, 0.3)
        .setOrigin(0.5)
        .setStrokeStyle(1, 0x3b82f6, 0.8);
    
    const xpIcon = this.add.text(0, -25, '✨', {
        fontSize: '28px'
    }).setOrigin(0.5);
    
    const xpAmount = this.add.text(0, 10, xp.toString(), {
        fontFamily: 'Quicksand',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#3b82f6'
    }).setOrigin(0.5);
    
    const xpLabel = this.add.text(0, 35, 'Experience', {
        fontFamily: 'Quicksand',
        fontSize: '14px',
        color: '#fff'
    }).setOrigin(0.5);
    
    xpContainer.add([xpBg, xpIcon, xpAmount, xpLabel]);
    
    const gemsContainer = this.add.container(80, 0);
    const gemsBg = this.add.rectangle(0, 0, 150, 100, 0xf59e0b, 0.3)
        .setOrigin(0.5)
        .setStrokeStyle(1, 0xf59e0b, 0.8);
    
    const gemsIcon = this.add.text(0, -25, '💎', {
        fontSize: '28px'
    }).setOrigin(0.5);
    
    const gemsAmount = this.add.text(0, 10, gems.toString(), {
        fontFamily: 'Quicksand',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#f59e0b'
    }).setOrigin(0.5);
    
    const gemsLabel = this.add.text(0, 35, 'Gems', {
        fontFamily: 'Quicksand',
        fontSize: '14px',
        color: '#fff'
    }).setOrigin(0.5);
    
    gemsContainer.add([gemsBg, gemsIcon, gemsAmount, gemsLabel]);
    
    // Continue button
    const continueButton = new Button(
        this,
        0,
        100,
        'Continue',
        { fontSize: '18px', fontStyle: 'bold' },
        () => {
            this.sounds.click.play();
            this.scene.start('WorldMapScene');
        },
        180,
        50
    );
    
    this.rewardPanel.add([panel, title, trophy, xpContainer, gemsContainer, continueButton]);
    
    // Animation for panel appearance
    this.rewardPanel.setScale(0.8);
    this.rewardPanel.alpha = 0;
    
    this.tweens.add({
        targets: this.rewardPanel,
        scale: 1,
        alpha: 1,
        duration: 500,
        ease: 'Power2'
    });
    
    // Animate XP and gem numbers counting up
    this.tweens.addCounter({
        from: 0,
        to: xp,
        duration: 1500,
        onUpdate: (tween) => {
            const value = Math.round(tween.getValue());
            xpAmount.setText(value.toString());
        }
    });
    
    this.tweens.addCounter({
        from: 0,
        to: gems,
        duration: 1500,
        onUpdate: (tween) => {
            const value = Math.round(tween.getValue());
            gemsAmount.setText(value.toString());
        }
    });
}

showDefeatScreen(xp) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create defeat panel
    this.defeatPanel = this.add.container(width / 2, height / 2);
    
    // Panel background
    const panel = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.8)
        .setOrigin(0.5)
        .setStrokeStyle(2, 0xffffff, 0.5);
    
    // Panel title
    const title = this.add.text(0, -120, 'Defeat', {
        fontFamily: 'Quicksand',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ef4444'
    }).setOrigin(0.5);
    
    // Defeat icon
    const defeatIcon = this.add.text(0, -80, '💔', {
        fontSize: '40px'
    }).setOrigin(0.5);
    
    // Message
    const message = this.add.text(0, -30, `You were defeated by ${this.currentEnemy.name}.\nDon't worry, you can try again!`, {
        fontFamily: 'Quicksand',
        fontSize: '16px',
        color: '#fff',
        align: 'center'
    }).setOrigin(0.5);
    
    // Consolation XP
    const xpText = this.add.text(0, 20, `Consolation XP: +${xp}`, {
        fontFamily: 'Quicksand',
        fontSize: '18px',
        color: '#3b82f6'
    }).setOrigin(0.5);
    
    // Buttons
    const retryButton = new Button(
        this,
        -80,
        80,
        'Try Again',
        { fontSize: '16px' },
        () => {
            this.sounds.click.play();
            this.scene.restart();
        },
        150,
        45
    );
    
    const mapButton = new Button(
        this,
        80,
        80,
        'Return to Map',
        { fontSize: '16px' },
        () => {
            this.sounds.click.play();
            this.scene.start('WorldMapScene');
        },
        150,
        45
    );
    
    this.defeatPanel.add([panel, title, defeatIcon, message, xpText, retryButton, mapButton]);
    
    // Animation for panel appearance
    this.defeatPanel.setScale(0.8);
    this.defeatPanel.alpha = 0;
    
    this.tweens.add({
        targets: this.defeatPanel,
        scale: 1,
        alpha: 1,
        duration: 500,
        ease: 'Power2'
    });
}

addExperience(amount) {
    // Current XP and next level threshold
    const currentXP = GameData.player.experience;
    const xpNeeded = GameData.player.level * 100;
    const newXP = currentXP + amount;
    
    // Check for level up
    if (newXP >= xpNeeded) {
        // Level up
        GameData.player.level++;
        GameData.player.experience = newXP - xpNeeded;
        
        // Show level up animation
        this.showLevelUp();
        
        // Add skill points
        GameData.player.stats.skillPoints += 3;
    } else {
        // Just add XP
        GameData.player.experience = newXP;
    }
}

showLevelUp() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Flash effect
    this.cameras.main.flash(500, 255, 255, 255, true);
    
    // Level up text
    const levelUp = this.add.text(width / 2, height / 2 - 100, 'LEVEL UP!', {
        fontFamily: 'Quicksand',
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#8b5cf6',
        stroke: '#000',
        strokeThickness: 6
    })
    .setOrigin(0.5)
    .setAlpha(0);
    
    // New level
    const newLevel = this.add.text(width / 2, height / 2 - 40, `Level ${GameData.player.level}`, {
        fontFamily: 'Quicksand',
        fontSize: '24px',
        color: '#fff',
        stroke: '#000',
        strokeThickness: 4
    })
    .setOrigin(0.5)
    .setAlpha(0);
    
    // Animation sequence
    this.tweens.add({
        targets: levelUp,
        alpha: 1,
        y: height / 2 - 120,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
            this.tweens.add({
                targets: newLevel,
                alpha: 1,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    // Hide after some time
                    this.time.delayedCall(1500, () => {
                        this.tweens.add({
                            targets: [levelUp, newLevel],
                            alpha: 0,
                            duration: 500,
                            ease: 'Power2',
                            onComplete: () => {
                                levelUp.destroy();
                                newLevel.destroy();
                            }
                        });
                    });
                }
            });
        }
    });
    
    // Show toast notification
    Utils.showToast(this, `Level Up! You are now level ${GameData.player.level}!`);
}

checkAchievements() {
    // First victory achievement
    if (GameData.player.progress.battlesWon === 1) {
        const achievement = GameData.achievements.find(a => a.id === 'first_victory');
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.showAchievement(achievement);
        }
    }
    
    // Word collector achievement
    if (GameData.player.progress.wordsLearned >= 10) {
        const achievement = GameData.achievements.find(a => a.id === 'word_collector');
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.showAchievement(achievement);
        }
    }
    
    // Combo master achievement
    if (this.comboMultiplier >= 5) {
        const achievement = GameData.achievements.find(a => a.id === 'combo_master');
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.showAchievement(achievement);
        }
    }
}

showAchievement(achievement) {
    const width = this.cameras.main.width;
    
    // Create achievement notification
    const container = this.add.container(width - 200, 150);
    
    // Background
    const bg = this.add.rectangle(0, 0, 350, 80, 0x000000, 0.8)
        .setOrigin(0.5)
        .setStrokeStyle(2, 0xfacc15, 0.8);
    
    // Trophy icon
    const icon = this.add.text(-150, 0, achievement.icon, {
        fontSize: '32px'
    }).setOrigin(0.5);
    
    // Achievement text
    const title = this.add.text(-100, -15, 'ACHIEVEMENT UNLOCKED!', {
        fontFamily: 'Quicksand',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#fbbf24'
    }).setOrigin(0, 0.5);
    
    const name = this.add.text(-100, 15, achievement.name, {
        fontFamily: 'Quicksand',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#fff'
    }).setOrigin(0, 0.5);
    
    container.add([bg, icon, title, name]);
    
    // Set initial position off-screen
    container.x = width + 200;
    
    // Slide in animation
    this.tweens.add({
        targets: container,
        x: width - 200,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
            // Stay visible for a few seconds
            this.time.delayedCall(3000, () => {
                // Slide out animation
                this.tweens.add({
                    targets: container,
                    x: width + 200,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        container.destroy();
                    }
                });
            });
        }
    });
    
    // Add rewards if any
    if (achievement.reward) {
        if (achievement.reward.gems) {
            GameData.player.inventory.gems += achievement.reward.gems;
        }
        
        if (achievement.reward.xp) {
            this.addExperience(achievement.reward.xp);
        }
    }
    
    Utils.showToast(this, `Achievement unlocked: ${achievement.name}!`);
}

showItemsPanel() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create items panel
    if (this.itemsPanel) {
        // Panel already exists, just show it
        this.itemsPanel.setVisible(true);
        return;
    }
    
    this.itemsPanel = this.add.container(width / 2, height / 2);
    
    // Panel background
    const panel = this.add.rectangle(0, 0, 500, 400, 0x000000, 0.9)
        .setOrigin(0.5)
        .setStrokeStyle(2, 0xffffff, 0.5);
    
    // Panel title
    const title = this.add.text(0, -170, 'Battle Items', {
        fontFamily: 'Quicksand',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#fff'
    }).setOrigin(0.5);
    
    // Close button
    const closeButton = this.add.text(240, -170, '✕', {
        fontSize: '24px',
        color: '#fff'
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
        this.sounds.click.play();
        this.itemsPanel.setVisible(false);
    });
    
    // Items list
    const itemsConfig = [
        {
            id: 'hint_book',
            name: 'Hint Book',
            description: 'Reveals two incorrect answers',
            icon: '📖',
            color: 0xfacc15,
            action: () => this.useItem('hint')
        },
        {
            id: 'shield_scroll',
            name: 'Shield Scroll',
            description: 'Blocks the next enemy attack',
            icon: '🛡️',
            color: 0x3b82f6,
            action: () => this.useItem('shield')
        },
        {
            id: 'double_damage',
            name: 'Power Rune',
            description: 'Doubles damage for your next attack',
            icon: '⚔️',
            color: 0xef4444,
            action: () => this.useItem('doubleAttack')
        },
        {
            id: 'health_potion',
            name: 'Health Potion',
            description: 'Restores 50 health points',
            icon: '❤️',
            color: 0xef4444,
            action: () => this.useItem('health')
        },
        {
            id: 'energy_boost',
            name: 'Energy Boost',
            description: 'Restores 30 energy points',
            icon: '⚡',
            color: 0xfacc15,
            action: () => this.useItem('energy')
        }
    ];
    
    const itemsContainers = [];
    
    itemsConfig.forEach((item, i) => {
        const y = -90 + i * 70;
        const itemContainer = this.add.container(0, y);
        
        // Item background
        const itemBg = this.add.rectangle(0, 0, 450, 60, 0xffffff, 0.1)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0xffffff, 0.3);
        
        // Item icon background
        const iconBg = this.add.circle(-200, 0, 25, item.color, 0.5)
            .setStrokeStyle(2, item.color, 0.8);
        
        // Item icon
        const icon = this.add.text(-200, 0, item.icon, {
            fontSize: '24px'
        }).setOrigin(0.5);
        
        // Item name
        const name = this.add.text(-160, -10, item.name, {
            fontFamily: 'Quicksand',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0, 0.5);
        
        // Item description
        const description = this.add.text(-160, 10, item.description, {
            fontFamily: 'Quicksand',
            fontSize: '14px',
            color: '#ccc'
        }).setOrigin(0, 0.5);
        
        // Quantity
        const quantity = this.add.text(170, 0, `x${GameData.player.inventory.potions[item.id] || 0}`, {
            fontFamily: 'Quicksand',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5);
        
        // Use button (only if quantity > 0)
        let useButton;
        if ((GameData.player.inventory.potions[item.id] || 0) > 0) {
            useButton = this.add.text(210, 0, 'Use', {
                fontFamily: 'Quicksand',
                fontSize: '14px',
                fontStyle: 'bold',
                color: '#fff',
                backgroundColor: '#3b82f6',
                padding: { x: 10, y: 5 }
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.sounds.click.play();
                item.action();
                this.itemsPanel.setVisible(false);
            });
        } else {
            useButton = this.add.text(210, 0, 'Use', {
                fontFamily: 'Quicksand',
                fontSize: '14px',
                fontStyle: 'bold',
                color: '#6b7280',
                backgroundColor: '#1f2937',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);
        }
        
        itemContainer.add([itemBg, iconBg, icon, name, description, quantity, useButton]);
        itemsContainers.push(itemContainer);
    });
    
    this.itemsPanel.add([panel, title, closeButton, ...itemsContainers]);
    
    // Animation for panel appearance
    this.itemsPanel.setScale(0.9);
    this.itemsPanel.alpha = 0;
    
    this.tweens.add({
        targets: this.itemsPanel,
        scale: 1,
        alpha: 1,
        duration: 200,
        ease: 'Power2'
    });
}

useItem(type) {
    if (this.battleState !== 'playerTurn') {
        Utils.showToast(this, 'You can only use items during your turn!');
        return;
    }
    
    switch(type) {
        case 'hint':
            // Use hint book to reveal two wrong answers
            if (GameData.player.inventory.potions.hint_book > 0) {
                // Find wrong answers
                const wrongOptions = Array.from({length: this.currentQuestion.options.length})
                    .map((_, i) => i)
                    .filter(i => i !== this.currentQuestion.correctAnswer);
                
                // Randomly select two wrong options to disable
                const shuffled = wrongOptions.sort(() => 0.5 - Math.random());
                const toDisable = shuffled.slice(0, 2);
                
                // Disable these options
                toDisable.forEach(index => {
                    if (this.answerButtons[index]) {
                        const bg = this.answerButtons[index].getAt(0);
                        bg.setFillStyle(0x6b7280, 0.4);
                        bg.setStrokeStyle(1, 0x6b7280, 0.5);
                        
                        // Disable interaction
                        this.answerButtons[index].disableInteractive();
                    }
                });
                
                // Activate powerup state
                this.powerupsActive.hint = true;
                this.updatePowerupsIndicator();
                
                // Deduct item
                GameData.player.inventory.potions.hint_book--;
                
                Utils.showToast(this, 'Hint Book used! Two wrong answers revealed.');
                this.addBattleLog('player_item', 'You used a Hint Book to reveal two wrong answers!');
            } else {
                Utils.showToast(this, 'You have no Hint Books!', 'error');
            }
            break;
            
        case 'shield':
            // Activate shield for next attack
            if (GameData.player.inventory.potions.shield_scroll > 0) {
                this.powerupsActive.shield = true;
                this.updatePowerupsIndicator();
                
                // Deduct item
                GameData.player.inventory.potions.shield_scroll--;
                
                Utils.showToast(this, 'Shield Scroll activated! Next attack will be blocked.');
                this.addBattleLog('player_item', 'You activated a Shield Scroll for protection!');
            } else {
                Utils.showToast(this, 'You have no Shield Scrolls!', 'error');
            }
            break;
            
        case 'doubleAttack':
            // Activate double damage for next attack
            if (GameData.player.inventory.potions.double_damage > 0) {
                this.powerupsActive.doubleAttack = true;
                this.updatePowerupsIndicator();
                
                // Deduct item
                GameData.player.inventory.potions.double_damage--;
                
                Utils.showToast(this, 'Power Rune activated! Next attack will deal double damage.');
                this.addBattleLog('player_item', 'You activated a Power Rune for double damage!');
            } else {
                Utils.showToast(this, 'You have no Power Runes!', 'error');
            }
            break;
            
        case 'health':
            // Use health potion
            if (GameData.player.inventory.potions.health_potion > 0) {
                const healAmount = 50;
                const newHealth = Math.min(GameData.player.maxHealth, GameData.player.health + healAmount);
                this.updatePlayerHealth(newHealth);
                
                // Deduct item
                GameData.player.inventory.potions.health_potion--;
                
                // Show healing effect
                Utils.addFloatingText(this, this.playerContainer.x + this.battleArena.x, this.playerContainer.y + this.battleArena.y - 60, `+${healAmount}`, {
                    fontSize: '24px',
                    color: '#10b981',
                    stroke: '#000',
                    strokeThickness: 4
                });
                
                Utils.showToast(this, `Health Potion used! +${healAmount} HP`);
                this.addBattleLog('player_item', `You used a Health Potion and recovered ${healAmount} HP!`);
            } else {
                Utils.showToast(this, 'You have no Health Potions!', 'error');
            }
            break;
            
        case 'energy':
            // Energy potions only used in world map
            Utils.showToast(this, 'Energy Boosts can only be used outside of battle.', 'error');
            break;
    }
    
    // Update saved game data
    GameData.saveGame();
}

addBattleLog(type, message) {
    // Limit log to 5 entries
    if (this.battleLogs.length >= 5) {
        this.battleLogs.shift();
    }
    
    // Add new log entry
    this.battleLogs.push({ type, message });
    
    // Update log display
    this.updateBattleLog();
}

updateBattleLog() {
    // Clear current log text
    this.logTextContainer.removeAll(true);
    
    // Add each log entry
    this.battleLogs.forEach((log, i) => {
        const y = -40 + i * 20;
        
        // Determine text color based on log type
        let color;
        switch(log.type) {
            case 'player_attack':
                color = '#3b82f6'; // Blue
                break;
            case 'player_critical':
                color = '#fbbf24'; // Yellow
                break;
            case 'player_miss':
            case 'player_item':
                color = '#9ca3af'; // Grey
                break;
            case 'player_block':
            case 'player_shield':
                color = '#10b981'; // Green
                break;
            case 'monster_attack':
                color = '#ef4444'; // Red
                break;
            case 'victory':
                color = '#10b981'; // Green
                break;
            case 'defeat':
                color = '#ef4444'; // Red
                break;
            default:
                color = '#fff'; // White
        }
        
        const text = this.add.text(0, y, log.message, {
            fontFamily: 'Quicksand',
            fontSize: '14px',
            color: color,
            wordWrap: { width: this.battleLog.width - 40 }
        }).setOrigin(0.5, 0);
        
        this.logTextContainer.add(text);
    });
}

updatePlayerHealth(newHealth) {
    // Update health bar
    this.playerHealth.setValue(newHealth);
    
    // Update game data
    GameData.player.health = newHealth;
}

updateEnemyHealth(newHealth) {
    // Update health bar
    this.enemyHealth.setValue(newHealth);
    
    // Update enemy data
    this.currentEnemy.health = newHealth;
}

showMessage(text, color = '#fff') {
    // Create or update message text
    if (this.messageText) {
        this.messageText.destroy();
    }
    
    this.messageText = this.add.text(this.cameras.main.width / 2, 180, text, {
        fontFamily: 'Quicksand',
        fontSize: '20px',
        fontStyle: 'bold',
        color: color,
        stroke: '#000',
        strokeThickness: 3
    }).setOrigin(0.5).setDepth(100);
    
    // Animation
    this.messageText.setAlpha(0);
    this.messageText.y += 20;
    
    this.tweens.add({
        targets: this.messageText,
        alpha: 1,
        y: 180,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
            // Auto hide after delay
            this.time.delayedCall(1500, () => {
                if (this.messageText) {
                    this.tweens.add({
                        targets: this.messageText,
                        alpha: 0,
                        y: 160,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => {
                            if (this.messageText) {
                                this.messageText.destroy();
                                this.messageText = null;
                            }
                        }
                    });
                }
            });
        }
    });
}

showTurnIndicator(turn) {
    // Remove existing indicators
    if (this.playerTurnIndicator) {
        this.playerTurnIndicator.destroy();
    }
    
    if (this.monsterTurnIndicator) {
        this.monsterTurnIndicator.destroy();
    }
    
    if (turn === null) return;
    
    if (turn === 'player') {
        // Show player turn indicator
        this.playerTurnIndicator = this.add.container(this.playerContainer.x, this.playerContainer.y + 40);
        
        const bg = this.add.rectangle(0, 0, 100, 24, 0xfacc15, 0.8)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0xffffff, 0.7);
            
        const text = this.add.text(0, 0, 'YOUR TURN', {
            fontFamily: 'Quicksand',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5);
        
        this.playerTurnIndicator.add([bg, text]);
        this.battleArena.add(this.playerTurnIndicator);
        
        // Add pulse animation
        this.tweens.add({
            targets: this.playerTurnIndicator,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    } else if (turn === 'monster') {
        // Show monster turn indicator
        this.monsterTurnIndicator = this.add.container(this.enemyContainer.x, this.enemyContainer.y + 40);
        
        const bg = this.add.rectangle(0, 0, 100, 24, 0xef4444, 0.8)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0xffffff, 0.7);
            
        const text = this.add.text(0, 0, 'ATTACKING', {
            fontFamily: 'Quicksand',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5);
        
        this.monsterTurnIndicator.add([bg, text]);
        this.battleArena.add(this.monsterTurnIndicator);
        
        // Add pulse animation
        this.tweens.add({
            targets: this.monsterTurnIndicator,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
}

playerAttackAnimation() {
    // Move player toward enemy
    this.tweens.add({
        targets: this.playerContainer,
        x: -100,
        duration: 150,
        yoyo: true,
        ease: 'Power2',
        onYoyo: () => {
            // Flash enemy in red
            this.tweens.add({
                targets: this.enemyContainer,
                alpha: 0.6,
                duration: 100,
                yoyo: true,
                repeat: 2
            });
            
            // Shake enemy
            this.tweens.add({
                targets: this.enemyContainer,
                x: this.enemyContainer.x + 5,
                duration: 50,
                yoyo: true,
                repeat: 3
            });
        }
    });
}

monsterAttackAnimation() {
    // Move monster toward player
    this.tweens.add({
        targets: this.enemyContainer,
        x: 100,
        duration: 150,
        yoyo: true,
        ease: 'Power2',
        onYoyo: () => {
            // Flash player in red
            this.tweens.add({
                targets: this.playerContainer,
                alpha: 0.6,
                duration: 100,
                yoyo: true,
                repeat: 2
            });
            
            // Shake player
            this.tweens.add({
                targets: this.playerContainer,
                x: this.playerContainer.x - 5,
                duration: 50,
                yoyo: true,
                repeat: 3
            });
        }
    });
}

updatePowerupsIndicator() {
    // Clear existing indicators
    if (this.powerupsIndicator) {
        this.powerupsIndicator.removeAll(true);
    }
    
    const activePowerups = [];
    
    // Check for active powerups
    if (this.powerupsActive.shield) {
        activePowerups.push({
            icon: '🛡️',
            text: 'Shield Active',
            color: 0x3b82f6
        });
    }
    
    if (this.powerupsActive.doubleAttack) {
        activePowerups.push({
            icon: '⚔️',
            text: 'Double Damage',
            color: 0xef4444
        });
    }
    
    if (this.powerupsActive.hint) {
        activePowerups.push({
            icon: '📖',
            text: 'Hint Active',
            color: 0xfacc15
        });
    }
    
    // If no active powerups, hide the indicator
    if (activePowerups.length === 0) {
        return;
    }
    
    // Create indicators for each active powerup
    activePowerups.forEach((powerup, i) => {
        const x = (i - (activePowerups.length - 1) / 2) * 120;
        
        const container = this.add.container(x, 0);
        
        const bg = this.add.rectangle(0, 0, 110, 30, powerup.color, 0.6)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0xffffff, 0.7);
            
        const icon = this.add.text(-40, 0, powerup.icon, {
            fontSize: '16px'
        }).setOrigin(0.5);
        
        const text = this.add.text(-20, 0, powerup.text, {
            fontFamily: 'Quicksand',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0, 0.5);
        
        container.add([bg, icon, text]);
        this.powerupsIndicator.add(container);
    });
}

// js/scenes/ConversationScene.js - Conversation with NPCs Scene
class ConversationScene extends Phaser.Scene {
    constructor() {
        super('ConversationScene');
    }
    
    create() {
        // TO BE IMPLEMENTED
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Conversation Mode Coming Soon!', {
            fontFamily: 'Quicksand',
            fontSize: '24px',
            color: '#fff'
        }).setOrigin(0.5);
        
        // Back Button
        const backButton = new Button(
            this,
            this.cameras.main.width / 2,
            this.cameras.main.height - 100,
            'Return to Map',
            { fontSize: '18px' },
            () => {
                this.scene.start('WorldMapScene');
            }
        );
    }
}

// js/scenes/CraftingScene.js - Word Crafting Scene
class CraftingScene extends Phaser.Scene {
    constructor() {
        super('CraftingScene');
    }
    
    create() {
        // TO BE IMPLEMENTED
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Word Crafting Mode Coming Soon!', {
            fontFamily: 'Quicksand',
            fontSize: '24px',
            color: '#fff'
        }).setOrigin(0.5);
        
        // Back Button
        const backButton = new Button(
            this,
            this.cameras.main.width / 2,
            this.cameras.main.height - 100,
            'Return to Map',
            { fontSize: '18px' },
            () => {
                this.scene.start('WorldMapScene');
            }
        );
    }
}

// js/scenes/RhythmScene.js - Pronunciation Rhythm Game Scene
class RhythmScene extends Phaser.Scene {
    constructor() {
        super('RhythmScene');
    }
    
    create() {
        // TO BE IMPLEMENTED
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Pronunciation Rhythm Game Coming Soon!', {
            fontFamily: 'Quicksand',
            fontSize: '24px',
            color: '#fff'
        }).setOrigin(0.5);
        
        // Back Button
        const backButton = new Button(
            this,
            this.cameras.main.width / 2,
            this.cameras.main.height - 100,
            'Return to Map',
            { fontSize: '18px' },
            () => {
                this.scene.start('WorldMapScene');
            }
        );
    }
}

// js/scenes/UIScene.js - Global UI Overlay Scene
class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }
    
    create() {
        // This scene will handle global UI elements like notifications
        // Will be implemented later if needed
    }
}

// js/main.js - Game Initialization
window.onload = function() {
    // Create the game with our configuration
    const game = new Phaser.Game(config);
    
    // Handle browser visibility changes
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Game lost focus, pause it
            game.scene.getScenes(true).forEach(scene => {
                if (scene.scene.isActive()) {
                    scene.scene.pause();
                }
            });
        } else {
            // Game regained focus, resume it
            game.scene.getScenes(true).forEach(scene => {
                if (scene.scene.isPaused()) {
                    scene.scene.resume();
                }
            });
        }
    });
};
```
