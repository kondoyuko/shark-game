// グローバル変数
let game;
let scene;
let shark;
let fishes;
let score = 0;
let highScore = parseInt(localStorage.getItem('sharkGameHighScore')) || 0;
let gameStarted = false;
let gameOver = false;
let startScreen;
let scoreText;
let timeText;
let gameOverText;
let highScoreText;
let timeLeft = 30;
const GAME_DURATION = 30;

// 定数
const BASE_FONT_SIZES = {
    title: 32,
    sharkEmoji: 40,
    fishEmoji: 32,
    button: 24,
    text: 20,
    score: 16,
    gameOver: 40
};

// シャークと魚のサイズ
const CHARACTER_SCALES = {
    shark: 1.0,
    fish: 0.8
};

// ゲーム内の余白
const GAME_PADDING = {
    top: 40,
    bottom: 40,
    left: 40,
    right: 40
};

// モバイル操作用の設定
const TOUCH_CONTROL = {
    enabled: false,
    startX: 0,
    startY: 0,
    moveThreshold: 5,
    speed: 200  // スマホ用の速度を設定
};

// キーボード操作の速度
const KEYBOARD_SPEED = 150;

// Phaserの設定
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#4488AA',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 450
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
        update: update
    }
};

// ゲームインスタンスの作成
window.addEventListener('load', () => {
    game = new Phaser.Game(config);
});

function calculateFontSize(baseSize) {
    const width = game.scale.width;
    const height = game.scale.height;
    const minDimension = Math.min(width, height);
    return Math.max(Math.floor(minDimension / 25), 14);
}

function calculateUISize() {
    const scaleFactor = calculateFontSize(16) / 16;
    const sizes = {};
    
    Object.keys(BASE_FONT_SIZES).forEach(key => {
        sizes[key] = Math.floor(BASE_FONT_SIZES[key] * scaleFactor);
    });
    
    return sizes;
}

function create() {
    scene = this;
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // タッチ操作の設定
    this.input.addPointer(1);
    
    this.input.on('pointerdown', function(pointer) {
        if (!gameStarted) {
            startGame();
            return;
        }
        
        if (gameStarted && !gameOver) {
            TOUCH_CONTROL.enabled = true;
            TOUCH_CONTROL.startX = pointer.x;
            TOUCH_CONTROL.startY = pointer.y;
        }
    });
    
    this.input.on('pointermove', function(pointer) {
        if (gameStarted && !gameOver && TOUCH_CONTROL.enabled && shark) {
            const dx = pointer.x - TOUCH_CONTROL.startX;
            const dy = pointer.y - TOUCH_CONTROL.startY;
            
            if (Math.abs(dx) > TOUCH_CONTROL.moveThreshold || Math.abs(dy) > TOUCH_CONTROL.moveThreshold) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                const normalizedDx = dx / distance;
                const normalizedDy = dy / distance;
                
                shark.body.setVelocity(
                    normalizedDx * TOUCH_CONTROL.speed,
                    normalizedDy * TOUCH_CONTROL.speed
                );
                
                if (Math.abs(normalizedDx) > 0.1) {
                    shark.setScale(normalizedDx > 0 ? -CHARACTER_SCALES.shark : CHARACTER_SCALES.shark, CHARACTER_SCALES.shark);
                }
                
                TOUCH_CONTROL.startX = pointer.x;
                TOUCH_CONTROL.startY = pointer.y;
            }
        }
    });
    
    this.input.on('pointerup', function() {
        if (shark) {
            TOUCH_CONTROL.enabled = false;
            shark.body.setVelocity(0, 0);
        }
    });
    
    createStartScreen();
}

function createStartScreen() {
    const width = game.scale.width;
    const height = game.scale.height;
    const sizes = calculateUISize();
    
    const title = scene.add.text(width / 2, height * 0.3, 'シャーくんの\nおさかなキャッチ！', {
        fontSize: `${sizes.title}px`,
        fill: '#fff',
        align: 'center'
    }).setOrigin(0.5);
    
    const startButton = scene.add.text(width / 2, height * 0.6, 'タップしてスタート', {
        fontSize: `${sizes.button}px`,
        fill: '#fff'
    }).setOrigin(0.5);
    
    const highScoreDisplay = scene.add.text(width / 2, height * 0.8, 'ハイスコア: ' + highScore + '匹', {
        fontSize: `${sizes.text}px`,
        fill: '#fff'
    }).setOrigin(0.5);
    
    startScreen = scene.add.container(0, 0);
    startScreen.add([title, startButton, highScoreDisplay]);
}

function update() {
    if (!gameStarted || gameOver) return;
    
    // キーボード操作
    if (!TOUCH_CONTROL.enabled) {
        let velocityX = 0;
        let velocityY = 0;
        
        if (scene.cursors.left.isDown) {
            velocityX = -KEYBOARD_SPEED;
            shark.setScale(CHARACTER_SCALES.shark, CHARACTER_SCALES.shark);
        } else if (scene.cursors.right.isDown) {
            velocityX = KEYBOARD_SPEED;
            shark.setScale(-CHARACTER_SCALES.shark, CHARACTER_SCALES.shark);
        }
        
        if (scene.cursors.up.isDown) {
            velocityY = -KEYBOARD_SPEED;
        } else if (scene.cursors.down.isDown) {
            velocityY = KEYBOARD_SPEED;
        }
        
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }
        
        shark.body.setVelocity(velocityX, velocityY);
    }
    
    // シャークが画面外に出ないように制限
    const sharkHalfWidth = shark.width * Math.abs(shark.scaleX) / 2;
    const sharkHalfHeight = shark.height * shark.scaleY / 2;
    
    shark.x = Phaser.Math.Clamp(
        shark.x,
        GAME_PADDING.left + sharkHalfWidth,
        game.scale.width - GAME_PADDING.right - sharkHalfWidth
    );
    shark.y = Phaser.Math.Clamp(
        shark.y,
        GAME_PADDING.top + sharkHalfHeight,
        game.scale.height - GAME_PADDING.bottom - sharkHalfHeight
    );
    
    // 画面外の魚を削除
    if (fishes) {
        fishes.getChildren().forEach((fish) => {
            const bounds = fish.getBounds();
            const margin = 100;
            
            if (bounds.right < -margin || 
                bounds.left > game.scale.width + margin ||
                bounds.bottom < -margin || 
                bounds.top > game.scale.height + margin) {
                fish.destroy();
            }
        });
    }
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
    const height = game.scale.height;
    const margin = Math.max(width * 0.03, 10);
    
    // UIの作成
    timeText = scene.add.text(margin, margin, '残り時間: ' + timeLeft + '秒', {
        fontSize: `${sizes.score}px`,
        fill: '#fff'
    });
    
    scoreText = scene.add.text(width / 2, margin, 'スコア: 0匹', {
        fontSize: `${sizes.score}px`,
        fill: '#fff'
    }).setOrigin(0.5, 0);
    
    highScoreText = scene.add.text(width - margin, margin, 'ハイスコア: ' + highScore + '匹', {
        fontSize: `${sizes.score}px`,
        fill: '#fff'
    }).setOrigin(1, 0);
    
    // シャークの作成
    shark = scene.add.text(width / 2, height / 2, '🦈', {
        fontSize: `${sizes.sharkEmoji}px`,
        padding: { x: 10, y: 10 }
    });
    shark.setOrigin(0.5);
    shark.setScale(CHARACTER_SCALES.shark);
    
    scene.physics.world.enable(shark);
    shark.body.setCollideWorldBounds(true);
    
    // シャークの当たり判定を調整
    const sharkHitboxSize = Math.min(shark.width, shark.height) * 0.4;  // 当たり判定を小さく
    shark.body.setSize(sharkHitboxSize, sharkHitboxSize);
    shark.body.setOffset(
        (shark.width - sharkHitboxSize) / 2,
        (shark.height - sharkHitboxSize) / 2
    );
    
    // 魚のグループを作成
    fishes = scene.physics.add.group();
    
    // タイマーの設定
    scene.time.addEvent({
        delay: 1000,
        callback: updateTimer,
        callbackScope: scene,
        loop: true
    });
    
    // 魚の生成タイマー
    scene.time.addEvent({
        delay: 1000,
        callback: function() {
            createFish.call(scene);
        },
        loop: true
    });
    
    // 初期の魚を生成
    createFish.call(scene);
    createFish.call(scene);
    createFish.call(scene);
}

function createFish() {
    if (!gameStarted || gameOver) return;
    
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const x = side === 'left' ? -20 : game.scale.width + 20;
    const y = Phaser.Math.Between(50, game.scale.height - 50);
    
    const fish = scene.add.text(x, y, '🐟', {
        fontSize: '32px'
    });
    fish.setOrigin(0.5);
    
    scene.physics.world.enable(fish);
    
    // 魚の当たり判定を調整
    const fishHitboxSize = Math.min(fish.width, fish.height) * 0.5;
    fish.body.setSize(fishHitboxSize, fishHitboxSize);
    fish.body.setOffset(
        (fish.width - fishHitboxSize) / 2,
        (fish.height - fishHitboxSize) / 2
    );
    
    fishes.add(fish);
    
    const targetX = side === 'left' ? game.scale.width + 100 : -100;
    const speed = Phaser.Math.Between(80, 150);
    const duration = Math.abs(targetX - x) / speed * 1000;
    
    // 魚の向きを設定（常に進行方向を向く）
    fish.setScale(side === 'left' ? -1 : 1, 1);
    
    scene.tweens.add({
        targets: fish,
        x: targetX,
        duration: duration,
        ease: 'Linear',
        onComplete: () => {
            fish.destroy();
        }
    });
    
    // 衝突判定
    scene.physics.add.overlap(shark, fish, function(shark, fish) {
        fish.destroy();
        score++;
        scoreText.setText('スコア: ' + score + '匹');
        if (score > highScore) {
            highScore = score;
            highScoreText.setText('ハイスコア: ' + highScore + '匹');
            localStorage.setItem('sharkGameHighScore', highScore.toString());
        }
    });
}

function updateTimer() {
    if (!gameStarted || gameOver) return;
    
    timeLeft--;
    if (timeText) {
        timeText.setText('残り時間: ' + timeLeft + '秒');
    }
    
    if (timeLeft <= 0) {
        endGame();
    }
}

function endGame() {
    gameOver = true;
    scene.physics.pause();
    
    const width = game.scale.width;
    const height = game.scale.height;
    const sizes = calculateUISize();
    
    // ゲームオーバー画面を作成
    const gameOverContainer = scene.add.container(width / 2, height / 2);
    gameOverContainer.setDepth(1000);  // 最前面に表示
    
    const timeUpText = scene.add.text(0, -height * 0.2, '時間切れ！', {
        fontSize: `${sizes.gameOver}px`,
        fill: '#fff',
        align: 'center'
    }).setOrigin(0.5);
    
    const finalScore = scene.add.text(0, -height * 0.1, `スコア: ${score}匹`, {
        fontSize: `${sizes.title}px`,
        fill: '#fff'
    }).setOrigin(0.5);
    
    // リスタートボタンのスタイルを改善
    const restartButton = scene.add.text(0, height * 0.1, 'もう一度遊ぶ', {
        fontSize: `${sizes.button}px`,
        fill: '#fff',
        backgroundColor: '#000',
        padding: { x: 40, y: 20 },  // パディングを大きく
        fixedWidth: width * 0.4,    // 固定幅を設定
        align: 'center'             // テキストを中央寄せ
    }).setOrigin(0.5);
    
    // ヒットエリアを拡大
    const hitArea = new Phaser.Geom.Rectangle(
        -width * 0.2,   // 左端
        -height * 0.05, // 上端
        width * 0.4,    // 幅
        height * 0.1    // 高さ
    );
    
    restartButton.setInteractive({ 
        hitArea: hitArea,
        useHandCursor: true,
        draggable: false
    });
    
    // ホバー効果を追加
    restartButton.on('pointerover', () => {
        restartButton.setStyle({ fill: '#000', backgroundColor: '#fff' });
    });
    
    restartButton.on('pointerout', () => {
        restartButton.setStyle({ fill: '#fff', backgroundColor: '#000' });
    });
    
    restartButton.on('pointerdown', () => {
        gameOverContainer.destroy();
        scene.time.delayedCall(100, () => {
            restartGame();
        });
    });
    
    gameOverContainer.add([timeUpText, finalScore, restartButton]);
}

function restartGame() {
    // 既存のタイマーをすべて削除
    scene.time.removeAllEvents();
    
    // 物理エンジンを再開
    scene.physics.resume();
    
    // ゲーム状態をリセット
    gameStarted = false;
    gameOver = false;
    score = 0;
    timeLeft = GAME_DURATION;
    
    // 既存のオブジェクトをクリア
    if (fishes) {
        fishes.clear(true, true);
    }
    if (shark) {
        shark.destroy();
    }
    if (timeText) {
        timeText.destroy();
    }
    if (scoreText) {
        scoreText.destroy();
    }
    if (highScoreText) {
        highScoreText.destroy();
    }
    
    // スタート画面を表示
    createStartScreen();
}
