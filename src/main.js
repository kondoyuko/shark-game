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

// 定数
const BASE_FONT_SIZES = {
    title: 40,
    sharkEmoji: 56,
    fishEmoji: 40,
    button: 28,
    text: 24,
    score: 20,
    gameOver: 48
};

// シャークと魚のサイズ
const CHARACTER_SCALES = {
    shark: 1.5,
    fish: 1.2
};

// ゲーム内の余白（キャラクターが欠けないように）
const GAME_PADDING = {
    top: 40,
    bottom: 40,
    left: 40,
    right: 40
};

// タッチ操作の状態
let touchState = {
    isFlicking: false,
    velocityX: 0,
    velocityY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0
};

// フリック操作の設定
const FLICK_CONFIG = {
    minSwipeDistance: 10,
    friction: 0.95,
    maxSpeed: 500,
    minSpeed: 50
};

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
    const width = game.scale.width;
    const height = game.scale.height;
    const scaleFactor = Math.min(width / 800, height / 600);
    return Math.max(Math.round(baseSize * scaleFactor), 16);
}

// UI要素のサイズを計算
function calculateUISize() {
    return {
        title: calculateFontSize(BASE_FONT_SIZES.title),
        sharkEmoji: calculateFontSize(BASE_FONT_SIZES.sharkEmoji),
        fishEmoji: calculateFontSize(BASE_FONT_SIZES.fishEmoji),
        button: calculateFontSize(BASE_FONT_SIZES.button),
        text: calculateFontSize(BASE_FONT_SIZES.text),
        score: calculateFontSize(BASE_FONT_SIZES.score),
        gameOver: calculateFontSize(BASE_FONT_SIZES.gameOver)
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
    
    // タッチ入力の設定
    this.input.addPointer(1);
    
    // タッチ開始時
    this.input.on('pointerdown', function (pointer) {
        touchState.isFlicking = true;
        touchState.lastX = pointer.x;
        touchState.lastY = pointer.y;
        touchState.lastTime = pointer.time;
        touchState.velocityX = 0;
        touchState.velocityY = 0;
    });
    
    // タッチ移動中
    this.input.on('pointermove', function (pointer) {
        if (touchState.isFlicking && shark && gameStarted && !gameOver) {
            const dx = pointer.x - touchState.lastX;
            const dy = pointer.y - touchState.lastY;
            const dt = pointer.time - touchState.lastTime;
            
            if (dt > 0) {
                // 速度を計算（ピクセル/秒）
                touchState.velocityX = (dx / dt) * 1000;
                touchState.velocityY = (dy / dt) * 1000;
                
                // 最大速度を制限
                touchState.velocityX = Phaser.Math.Clamp(touchState.velocityX, -FLICK_CONFIG.maxSpeed, FLICK_CONFIG.maxSpeed);
                touchState.velocityY = Phaser.Math.Clamp(touchState.velocityY, -FLICK_CONFIG.maxSpeed, FLICK_CONFIG.maxSpeed);
            }
            
            touchState.lastX = pointer.x;
            touchState.lastY = pointer.y;
            touchState.lastTime = pointer.time;
            
            // シャークの向きを設定
            if (Math.abs(dx) > FLICK_CONFIG.minSwipeDistance) {
                shark.setScale(dx > 0 ? -CHARACTER_SCALES.shark : CHARACTER_SCALES.shark, CHARACTER_SCALES.shark);
            }
        }
    });
    
    // タッチ終了時
    this.input.on('pointerup', function () {
        touchState.isFlicking = false;
    });
    
    createStartScreen.call(this);
}

function update() {
    if (!gameStarted || gameOver) return;
    
    const SPEED = 300;

    // キーボード操作
    if (scene.cursors.left.isDown) {
        shark.body.setVelocityX(-SPEED);
        shark.setScale(CHARACTER_SCALES.shark, CHARACTER_SCALES.shark);
    } else if (scene.cursors.right.isDown) {
        shark.body.setVelocityX(SPEED);
        shark.setScale(-CHARACTER_SCALES.shark, CHARACTER_SCALES.shark);
    } else if (!touchState.isFlicking) {
        // フリック中でない場合は徐々に減速
        touchState.velocityX *= FLICK_CONFIG.friction;
        touchState.velocityY *= FLICK_CONFIG.friction;
        
        // 最小速度以下になったら停止
        if (Math.abs(touchState.velocityX) < FLICK_CONFIG.minSpeed) touchState.velocityX = 0;
        if (Math.abs(touchState.velocityY) < FLICK_CONFIG.minSpeed) touchState.velocityY = 0;
        
        shark.body.setVelocity(touchState.velocityX, touchState.velocityY);
    }
    
    if (scene.cursors.up.isDown) {
        shark.body.setVelocityY(-SPEED);
    } else if (scene.cursors.down.isDown) {
        shark.body.setVelocityY(SPEED);
    } else if (!touchState.isFlicking) {
        shark.body.setVelocityY(touchState.velocityY);
    }

    // 画面外の魚を削除
    fishes.getChildren().forEach((fish) => {
        if (fish.x < -100 || fish.x > game.scale.width + 100) {
            fish.destroy();
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
    shark.setScale(CHARACTER_SCALES.shark);
    
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
        GAME_PADDING.left,
        GAME_PADDING.top,
        game.scale.width - GAME_PADDING.left - GAME_PADDING.right,
        game.scale.height - GAME_PADDING.top - GAME_PADDING.bottom
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

    const x = Phaser.Math.Between(
        GAME_PADDING.left,
        game.scale.width - GAME_PADDING.right
    );
    const y = Phaser.Math.Between(
        GAME_PADDING.top,
        game.scale.height - GAME_PADDING.bottom
    );
    
    const fish = scene.add.text(x, y, '🐟', {
        fontSize: calculateUISize().fishEmoji + 'px'
    });
    fish.setOrigin(0.5);
    fish.setScale(CHARACTER_SCALES.fish);
    
    scene.physics.world.enable(fish);
    
    // 移動範囲を制限
    fish.body.setCollideWorldBounds(true);
    fish.body.setBoundsRectangle(new Phaser.Geom.Rectangle(
        GAME_PADDING.left,
        GAME_PADDING.top,
        game.scale.width - GAME_PADDING.left - GAME_PADDING.right,
        game.scale.height - GAME_PADDING.top - GAME_PADDING.bottom
    ));
    
    const speed = Phaser.Math.Between(150, 250);
    fish.body.setVelocity(
        Phaser.Math.Between(-speed, speed),
        Phaser.Math.Between(-speed, speed)
    );
    
    fishes.add(fish);
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
