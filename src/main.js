// グローバル変数
let scene;
let startScreen;
let gameOverScreen;
let shark;
let fishes;
let score = 0;
let highScore = parseInt(localStorage.getItem('sharkGameHighScore')) || 0;
let gameStarted = false;
let gameOver = false;
let timeText;
let scoreText;
let gameOverText;
let highScoreText;
let timeLeft = 30;
const GAME_DURATION = 30;

// Phaserの設定
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#4488AA',
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game-container',
        width: window.innerHeight * 0.75,  // 縦長の画面サイズ（4:3比率）
        height: window.innerHeight,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        create: create,
        update: update,
        resize: resize
    }
};

// ゲームの初期化
const game = new Phaser.Game(config);

// 画面サイズに応じたフォントサイズを計算
function calculateFontSize(baseSize) {
    const height = game.scale.height;
    const width = game.scale.width;
    const minDimension = Math.min(width, height);
    const scaleFactor = minDimension / 400; // 基準値を400pxに設定
    return Math.max(Math.floor(baseSize * scaleFactor), 12); // 最小サイズを12pxに設定
}

// UI要素のサイズを計算
function calculateUISize() {
    return {
        title: calculateFontSize(24),
        sharkEmoji: calculateFontSize(32),
        fishEmoji: calculateFontSize(24),
        button: calculateFontSize(20),
        text: calculateFontSize(16),
        score: calculateFontSize(14),
        gameOver: calculateFontSize(32)
    };
}

// ゲーム画面のリサイズ処理
function resize() {
    const height = window.innerHeight;
    const width = height * 0.75;
    game.scale.resize(width, height);
}

// リサイズイベントの監視
window.addEventListener('resize', () => {
    resize();
});

function create() {
    scene = this;
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // スタート画面の作成
    createStartScreen.call(this);
    
    // タッチ操作の初期化
    this.touchStartPos = null;
    
    // タッチ操作のイベントリスナー
    this.input.on('pointermove', (pointer) => {
        if (this.touchStartPos && gameStarted && !gameOver) {
            const dx = pointer.x - this.touchStartPos.x;
            const dy = pointer.y - this.touchStartPos.y;
            
            if (Math.abs(dx) > 10) {
                shark.body.setVelocityX(Math.sign(dx) * 300);
                shark.setScale(dx > 0 ? -1 : 1, 1);
            }
            
            if (Math.abs(dy) > 10) {
                shark.body.setVelocityY(Math.sign(dy) * 300);
            }
            
            this.touchStartPos = { x: pointer.x, y: pointer.y };
        }
    });
    
    this.input.on('pointerdown', (pointer) => {
        this.touchStartPos = { x: pointer.x, y: pointer.y };
    });
    
    this.input.on('pointerup', () => {
        this.touchStartPos = null;
        if (gameStarted && !gameOver) {
            shark.body.setVelocity(0, 0);
        }
    });
}

function createStartScreen() {
    startScreen = scene.add.container(0, 0);
    const sizes = calculateUISize();
    const centerX = game.scale.width / 2;
    const height = game.scale.height;
    const margin = height * 0.05; // 画面の5%を余白として使用
    
    const title = scene.add.text(centerX, margin + height * 0.1, 'シャーくんの\nおさかなキャッチ！', {
        fontSize: `${sizes.title}px`,
        fill: '#fff',
        align: 'center',
        lineSpacing: 10
    }).setOrigin(0.5);
    
    const sharkEmoji = scene.add.text(centerX, height * 0.3, '🦈', {
        fontSize: `${sizes.sharkEmoji}px`,
        padding: { x: 10, y: 10 }
    }).setOrigin(0.5);
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const controlsText = isMobile ? 
        'タップ＆ドラッグで\nシャーくんを動かして\n30秒以内にたくさんの\nおさかなを食べよう！' :
        '矢印キーで\nシャーくんを動かして\n30秒以内にたくさんの\nおさかなを食べよう！';
    
    const instructions = scene.add.text(centerX, height * 0.5, controlsText, {
        fontSize: `${sizes.text}px`,
        fill: '#fff',
        align: 'center',
        lineSpacing: 10
    }).setOrigin(0.5);
    
    const startButton = scene.add.text(centerX, height * 0.7, 'クリックしてスタート！', {
        fontSize: `${sizes.button}px`,
        fill: '#fff',
        backgroundColor: '#4a90e2',
        padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    startButton.setInteractive({ useHandCursor: true })
        .on('pointerover', () => startButton.setStyle({ fill: '#ff0' }))
        .on('pointerout', () => startButton.setStyle({ fill: '#fff' }))
        .on('pointerdown', () => startGame());

    const highScoreText = scene.add.text(
        game.scale.width - margin,
        margin,
        'ハイスコア: ' + highScore + '匹',
        {
            fontSize: `${sizes.score}px`,
            fill: '#fff'
        }
    ).setOrigin(1, 0);
    
    startScreen.add([title, sharkEmoji, instructions, startButton, highScoreText]);
}

function startGame() {
    if (gameStarted) return;
    
    if (startScreen) {
        startScreen.destroy();
    }
    
    gameStarted = true;
    gameOver = false;
    score = 0;
    timeLeft = GAME_DURATION;
    
    const sizes = calculateUISize();
    const width = game.scale.width;
    const minDimension = Math.min(width, game.scale.height);
    const margin = Math.max(minDimension * 0.03, 10); // 最小マージンを10pxに設定
    
    // スコア表示のレイアウト計算
    const scoreY = margin;
    
    // 残り時間とスコアを1行に結合
    timeText = scene.add.text(margin, scoreY, '残り時間: ' + timeLeft + '秒', {
        fontSize: `${sizes.score}px`,
        fill: '#fff'
    });

    scoreText = scene.add.text(width / 2, scoreY, 'スコア: 0匹', {
        fontSize: `${sizes.score}px`,
        fill: '#fff'
    }).setOrigin(0.5, 0);

    highScoreText = scene.add.text(width - margin, scoreY, 'ハイスコア: ' + highScore + '匹', {
        fontSize: `${sizes.score}px`,
        fill: '#fff'
    }).setOrigin(1, 0);

    // プレイエリアの境界を設定
    const headerHeight = sizes.score + margin * 2;
    const playAreaTop = headerHeight;
    const playAreaBottom = game.scale.height - margin;
    const playAreaLeft = margin;
    const playAreaRight = width - margin;
    
    // シャークの作成
    shark = scene.add.text(
        width / 2,
        playAreaTop + (playAreaBottom - playAreaTop) / 2,
        '🦈',
        { 
            fontSize: `${sizes.sharkEmoji}px`,
            padding: { x: 5, y: 5 }
        }
    );
    shark.setOrigin(0.5);
    
    scene.physics.world.enable(shark);
    shark.body.setCollideWorldBounds(true);
    shark.body.setBounce(0);
    shark.body.setDrag(0);
    
    const hitboxSize = Math.min(shark.width, shark.height) * 0.6;
    shark.body.setSize(hitboxSize, hitboxSize);
    shark.body.setOffset(
        (shark.width - hitboxSize) / 2,
        (shark.height - hitboxSize) / 2
    );

    // シャークの移動範囲を制限
    shark.body.setBoundsRectangle(new Phaser.Geom.Rectangle(
        playAreaLeft,
        playAreaTop,
        playAreaRight - playAreaLeft,
        playAreaBottom - playAreaTop
    ));

    fishes = scene.physics.add.group();
    scene.physics.add.overlap(shark, fishes, collectFish, null, scene);

    scene.time.addEvent({
        delay: 1000,
        callback: createFish,
        callbackScope: scene,
        loop: true
    });

    scene.time.addEvent({
        delay: 1000,
        callback: updateTimer,
        callbackScope: scene,
        loop: true
    });

    createFish();
}

function update() {
    if (!gameStarted || gameOver) return;

    const SPEED = 300;

    // キーボード入力の処理
    if (scene.cursors.left.isDown) {
        shark.body.setVelocityX(-SPEED);
        shark.setScale(1, 1);  // 左向きに移動する場合、サメは右向き
    } else if (scene.cursors.right.isDown) {
        shark.body.setVelocityX(SPEED);
        shark.setScale(-1, 1);   // 右向きに移動する場合、サメは左向き
    } else {
        shark.body.setVelocityX(0);
    }

    if (scene.cursors.up.isDown) {
        shark.body.setVelocityY(-SPEED);
    } else if (scene.cursors.down.isDown) {
        shark.body.setVelocityY(SPEED);
    } else {
        shark.body.setVelocityY(0);
    }

    // 画面外の魚を削除
    fishes.getChildren().forEach((fish) => {
        if (fish.x < -100 || fish.x > game.scale.width + 100) {
            fish.destroy();
        }
    });
}

function collectFish(shark, fish) {
    fish.destroy();
    score++;
    scoreText.setText('スコア: ' + score + '匹');
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('sharkGameHighScore', highScore);
        highScoreText.setText('ハイスコア: ' + highScore + '匹');
    }
}

function createFish() {
    if (!gameStarted || gameOver) return;

    const width = game.scale.width;
    const height = game.scale.height;
    const minDimension = Math.min(width, height);
    const margin = Math.max(minDimension * 0.03, 10);
    const sizes = calculateUISize();
    
    // プレイエリアの境界を計算
    const headerHeight = sizes.score + margin * 2;
    const playAreaTop = headerHeight;
    const playAreaBottom = height - margin;
    
    const x = Math.random() < 0.5 ? -50 : width + 50;
    const y = Phaser.Math.Between(
        playAreaTop + sizes.fishEmoji / 2,
        playAreaBottom - sizes.fishEmoji / 2
    );
    
    const fish = scene.add.text(x, y, '🐟', { 
        fontSize: `${sizes.fishEmoji}px`
    });
    fish.setOrigin(0.5);
    
    scene.physics.world.enable(fish);
    
    const hitboxSize = Math.min(fish.width, fish.height) * 0.6;
    fish.body.setSize(hitboxSize, hitboxSize);
    fish.body.setOffset(
        (fish.width - hitboxSize) / 2,
        (fish.height - hitboxSize) / 2
    );
    
    fishes.add(fish);
    
    const speed = Phaser.Math.Between(150, 300);
    if (x < 0) {
        fish.body.setVelocityX(speed);
        fish.setScale(-1, 1);
    } else {
        fish.body.setVelocityX(-speed);
        fish.setScale(1, 1);
    }
}

function updateTimer() {
    if (!gameStarted) return;

    timeLeft--;
    timeText.setText('残り時間: ' + timeLeft + '秒');
    
    if (timeLeft <= 0) {
        endGame.call(scene);
    }
}

function endGame() {
    gameStarted = false;
    gameOver = true;
    
    // タイマーとスコアの表示を削除
    if (timeText) timeText.destroy();
    if (scoreText) scoreText.destroy();
    if (highScoreText) highScoreText.destroy();
    
    // シャークと魚を削除
    if (shark) shark.destroy();
    if (fishes) fishes.clear(true, true);
    
    // ハイスコアを更新
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('sharkGameHighScore', highScore);
    }

    createGameOverScreen();
}

function restartGame() {
    // ゲームオーバー画面を削除
    if (gameOverScreen) {
        gameOverScreen.destroy();
    }
    
    // ゲーム状態をリセット
    gameStarted = false;
    gameOver = false;
    score = 0;
    timeLeft = GAME_DURATION;
    
    // スタート画面を作成
    createStartScreen.call(scene);
}

function createGameOverScreen() {
    gameOverScreen = scene.add.container(0, 0);
    
    const sizes = calculateUISize();
    const centerX = game.scale.width / 2;
    const height = game.scale.height;
    const margin = height * 0.05;
    
    const gameOverText = scene.add.text(centerX, margin + height * 0.2, 'ゲームオーバー！', {
        fontSize: `${sizes.gameOver}px`,
        fill: '#fff'
    }).setOrigin(0.5);
    
    const finalScore = scene.add.text(centerX, height * 0.4, `スコア: ${score}匹`, {
        fontSize: `${sizes.score}px`,
        fill: '#fff'
    }).setOrigin(0.5);
    
    const highScoreText = scene.add.text(centerX, height * 0.5, `ハイスコア: ${highScore}匹`, {
        fontSize: `${sizes.score}px`,
        fill: '#fff'
    }).setOrigin(0.5);
    
    const restartButton = scene.add.text(centerX, height * 0.65, 'もう一度遊ぶ', {
        fontSize: `${sizes.button}px`,
        fill: '#fff',
        backgroundColor: '#4a90e2',
        padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    restartButton.setInteractive({ useHandCursor: true })
        .on('pointerover', () => restartButton.setStyle({ fill: '#ff0' }))
        .on('pointerout', () => restartButton.setStyle({ fill: '#fff' }))
        .on('pointerdown', () => restartGame());
    
    gameOverScreen.add([gameOverText, finalScore, highScoreText, restartButton]);
}
