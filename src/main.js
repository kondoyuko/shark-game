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
    width: 800,
    height: 600,
    backgroundColor: '#4488AA',
    scale: {
        mode: Phaser.Scale.FIT,
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
        update: update
    }
};

// ゲームインスタンスの作成
const game = new Phaser.Game(config);

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
    
    const title = scene.add.text(config.width / 2, 120, 'シャーくんの\nおさかなキャッチ！', {
        fontSize: '36px',
        fill: '#fff',
        align: 'center',
        lineSpacing: 10
    }).setOrigin(0.5);
    
    const sharkEmoji = scene.add.text(config.width / 2, 230, '🦈', {
        fontSize: '64px',
        padding: { x: 20, y: 20 }
    }).setOrigin(0.5);
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const controlsText = isMobile ? 
        'タップ＆ドラッグでシャーくんを動かして\n30秒以内にたくさんのおさかなを食べよう！' :
        '矢印キーでシャーくんを動かして\n30秒以内にたくさんのおさかなを食べよう！';
    
    const instructions = scene.add.text(config.width / 2, 320, controlsText, {
        fontSize: '20px',
        fill: '#fff',
        align: 'center',
        lineSpacing: 10
    }).setOrigin(0.5);
    
    const startButton = scene.add.text(config.width / 2, 400, 'クリックしてスタート！', {
        fontSize: '24px',
        fill: '#fff',
        backgroundColor: '#4a90e2',
        padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    startButton.setInteractive({ useHandCursor: true })
        .on('pointerover', () => startButton.setStyle({ fill: '#ff0' }))
        .on('pointerout', () => startButton.setStyle({ fill: '#fff' }))
        .on('pointerdown', () => startGame());

    // ハイスコアを右上に表示
    const highScoreText = scene.add.text(
        config.width - 16,
        16,
        'ハイスコア: ' + highScore + '匹',
        {
            fontSize: '20px',
            fill: '#fff'
        }
    ).setOrigin(1, 0);
    
    startScreen.add([title, sharkEmoji, instructions, startButton, highScoreText]);
}

function createGameOverScreen() {
    gameOverScreen = scene.add.container(0, 0);
    
    const gameOverText = scene.add.text(config.width / 2, 200, 'ゲームオーバー！', {
        fontSize: '48px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    const finalScore = scene.add.text(config.width / 2, 300, `スコア: ${score}匹`, {
        fontSize: '32px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    const highScoreText = scene.add.text(config.width / 2, 350, `ハイスコア: ${highScore}匹`, {
        fontSize: '32px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    const restartButton = scene.add.text(config.width / 2, 450, 'もう一度遊ぶ', {
        fontSize: '28px',
        fill: '#fff',
        backgroundColor: '#4a90e2',
        padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    restartButton.setInteractive({ useHandCursor: true })
        .on('pointerover', () => restartButton.setStyle({ fill: '#ff0' }))
        .on('pointerout', () => restartButton.setStyle({ fill: '#fff' }))
        .on('pointerdown', () => {
            gameOverScreen.destroy();
            createStartScreen.call(scene);
        });
    
    gameOverScreen.add([gameOverText, finalScore, highScoreText, restartButton]);
}

function startGame() {
    if (gameStarted) return;
    
    // スタート画面を削除
    if (startScreen) {
        startScreen.destroy();
    }
    
    // ゲーム状態の初期化
    gameStarted = true;
    gameOver = false;
    score = 0;
    timeLeft = GAME_DURATION;
    
    // シャーくんの作成
    shark = scene.add.text(400, 225, '🦈', { 
        fontSize: '36px',
        padding: { x: 10, y: 10 }
    });
    shark.setOrigin(0.5);
    
    // シャーくんの物理演算設定
    scene.physics.world.enable(shark);
    shark.body.setCollideWorldBounds(true);
    shark.body.setBounce(0);
    shark.body.setDrag(0);
    
    // 当たり判定のサイズと位置を調整（向きに関係なく中央に固定）
    const hitboxSize = Math.min(shark.width, shark.height) * 0.6;
    shark.body.setSize(hitboxSize, hitboxSize);
    shark.body.setOffset(
        (shark.width - hitboxSize) / 2,
        (shark.height - hitboxSize) / 2
    );

    // 魚グループの作成
    fishes = scene.physics.add.group();

    // タイマーテキストの作成（上部に配置）
    timeText = scene.add.text(16, 16, '残り時間: ' + timeLeft + '秒', {
        fontSize: '24px',
        fill: '#fff'
    });

    // スコアテキストの作成（タイマーの下に配置）
    scoreText = scene.add.text(16, 56, 'スコア: 0匹', {
        fontSize: '24px',
        fill: '#fff'
    });

    // ハイスコアテキストの作成（右上に配置）
    highScoreText = scene.add.text(config.width - 16, 16, 'ハイスコア: ' + highScore + '匹', {
        fontSize: '24px',
        fill: '#fff'
    });
    highScoreText.setOrigin(1, 0);

    // 衝突判定の設定
    scene.physics.add.overlap(shark, fishes, collectFish, null, scene);

    // 魚の生成タイマー
    scene.time.addEvent({
        delay: 1000,
        callback: createFish,
        callbackScope: scene,
        loop: true
    });

    // ゲームタイマー
    scene.time.addEvent({
        delay: 1000,
        callback: updateTimer,
        callbackScope: scene,
        loop: true
    });

    // 最初の魚を生成
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
        if (fish.x < -100 || fish.x > config.width + 100) {
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

    const x = Math.random() < 0.5 ? -50 : config.width + 50;
    const y = Phaser.Math.Between(50, config.height - 50);
    
    const fish = scene.add.text(x, y, '🐟', { 
        fontSize: '24px'
    });
    fish.setOrigin(0.5);
    
    scene.physics.world.enable(fish);
    
    // 魚の当たり判定のサイズと位置を調整（向きに関係なく中央に固定）
    const hitboxSize = Math.min(fish.width, fish.height) * 0.6;
    fish.body.setSize(hitboxSize, hitboxSize);
    fish.body.setOffset(
        (fish.width - hitboxSize) / 2,
        (fish.height - hitboxSize) / 2
    );
    
    fishes.add(fish);
    
    const speed = Phaser.Math.Between(100, 300);
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
