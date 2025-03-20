// グローバル変数
let game;
let shark;
let fishes;
let score = 0;
let highScore = parseInt(localStorage.getItem('sharkGameHighScore')) || 0;
let gameOver = false;
let gameStarted = false;
let startScreen;
let scoreText;
let timeText;
let gameOverText;
let highScoreText;
let timeLeft = 30;

// Phaserの設定
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 450,
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
window.addEventListener('load', () => {
    game = new Phaser.Game(config);
});

function createStartScreen() {
    startScreen = this.add.group();

    const titleText = this.add.text(400, 120, 'シャーくんのおさかなキャッチ！', {
        fontSize: '40px',
        fill: '#fff',
        align: 'center'
    });
    titleText.setOrigin(0.5);

    const sharkEmoji = this.add.text(400, 225, '🦈', {
        fontSize: '72px',
        align: 'center',
        padding: { x: 32, y: 32 }
    });
    sharkEmoji.setOrigin(0.5);

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const controlsText = isMobile ? 
        'タップ＆ドラッグでシャーくんを動かして\n30秒以内にたくさんのおさかなを食べよう！' :
        '矢印キーでシャーくんを動かして\n30秒以内にたくさんのおさかなを食べよう！';
    
    const instructionText = this.add.text(400, 330, controlsText, {
        fontSize: '24px',
        fill: '#fff',
        align: 'center'
    });
    instructionText.setOrigin(0.5);

    startScreen.add(titleText);
    startScreen.add(sharkEmoji);
    startScreen.add(instructionText);

    // ハイスコアを右上に表示
    updateHighScoreText.call(this);
}

function create() {
    // スタート画面の作成
    createStartScreen.call(this);

    // キーボード入力の設定
    this.cursors = this.input.keyboard.createCursorKeys();

    // タッチ操作の初期化
    this.touchStartPos = null;

    // タッチ操作のイベント設定
    this.input.on('pointermove', (pointer) => {
        if (gameStarted && !gameOver && this.touchStartPos) {
            const deltaX = pointer.x - this.touchStartPos.x;
            const deltaY = pointer.y - this.touchStartPos.y;
            
            shark.x += deltaX * 0.5;
            shark.y += deltaY * 0.5;
            
            if (deltaX < 0) {
                shark.setScale(1, 1);
            } else if (deltaX > 0) {
                shark.setScale(-1, 1);
            }
            
            shark.x = Phaser.Math.Clamp(shark.x, 0, config.width);
            shark.y = Phaser.Math.Clamp(shark.y, 0, config.height);
            
            this.touchStartPos = { x: pointer.x, y: pointer.y };
        }
    });

    // タッチ開始
    this.input.on('pointerdown', (pointer) => {
        this.touchStartPos = { x: pointer.x, y: pointer.y };
        if (!gameStarted) {
            startGame.call(this);
        } else if (gameOver) {
            restartGame.call(this);
        }
    });

    // タッチ終了
    this.input.on('pointerup', () => {
        this.touchStartPos = null;
    });

    // キーボードイベント
    this.input.keyboard.on('keydown', () => {
        if (!gameStarted) {
            startGame.call(this);
        } else if (gameOver) {
            restartGame.call(this);
        }
    });
}

function startGame() {
    if (gameStarted) return;
    
    gameStarted = true;
    score = 0;
    timeLeft = 30;
    
    // スタート画面を削除
    if (startScreen) {
        startScreen.clear(true, true);
    }
    
    // ゲーム要素の初期化
    initializeGameElements.call(this);

    // タイマーの設定（ゲーム開始時のみ）
    this.time.addEvent({
        delay: 1000,
        callback: updateTimer,
        callbackScope: this,
        repeat: 29  // 30秒のため、最初の1回 + 29回の繰り返し
    });

    // 魚の生成タイマー
    this.time.addEvent({
        delay: 1000,
        callback: () => createFish.call(this),
        callbackScope: this,
        loop: true
    });

    // さらに追加の魚生成タイマー
    this.time.addEvent({
        delay: 1200,
        callback: () => createFish.call(this),
        callbackScope: this,
        loop: true
    });
}

function initializeGameElements() {
    // シャーくんの作成
    shark = this.add.text(400, 225, '🦈', { 
        fontSize: '36px',
        padding: { x: 10, y: 10 }
    });
    shark.setOrigin(0.5);
    
    // シャーくんの物理演算設定
    this.physics.world.enable(shark);
    shark.body.setCollideWorldBounds(true);
    shark.body.setBounce(0);
    shark.body.setDrag(0);

    // 魚グループの作成
    fishes = this.physics.add.group({
        allowGravity: false,
        immovable: false,
        bounceX: 0,
        bounceY: 0,
        dragX: 0,
        dragY: 0
    });

    // タイマーテキストの作成（上部に配置）
    timeText = this.add.text(16, 16, '残り時間: 30秒', {
        fontSize: '24px',
        fill: '#fff'
    });

    // スコアテキストの作成（タイマーの下に配置）
    scoreText = this.add.text(16, 56, 'スコア: 0匹', {
        fontSize: '24px',
        fill: '#fff'
    });

    // ハイスコアテキストの作成（右上に配置）
    highScoreText = this.add.text(config.width - 16, 16, 'ハイスコア: ' + highScore + '匹', {
        fontSize: '24px',
        fill: '#fff'
    });
    highScoreText.setOrigin(1, 0);

    // 衝突判定の設定
    this.physics.add.overlap(shark, fishes, collectFish, null, this);
}

function update() {
    if (!gameStarted || gameOver) return;

    const SPEED = 300;

    // キーボード入力の処理
    if (this.cursors.left.isDown) {
        shark.body.setVelocityX(-SPEED);
        shark.setScale(1, 1);
    } else if (this.cursors.right.isDown) {
        shark.body.setVelocityX(SPEED);
        shark.setScale(-1, 1);
    } else {
        shark.body.setVelocityX(0);
    }

    if (this.cursors.up.isDown) {
        shark.body.setVelocityY(-SPEED);
    } else if (this.cursors.down.isDown) {
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
    score += 1;
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
    
    const fish = this.add.text(x, y, '🐟', { 
        fontSize: '24px'
    });
    fish.setOrigin(0.5);
    
    // 魚の物理演算を有効化
    this.physics.world.enable(fish);
    fishes.add(fish);
    
    const speed = Phaser.Math.Between(100, 300);
    
    if (x < 0) {
        fish.body.setVelocityX(speed);
        fish.setScale(1, 1);
    } else {
        fish.body.setVelocityX(-speed);
        fish.setScale(-1, 1);
    }
}

function updateTimer() {
    if (!gameStarted) return;

    timeLeft--;
    timeText.setText('残り時間: ' + timeLeft + '秒');
    
    if (timeLeft <= 0) {
        endGame.call(this);
    }
}

function endGame() {
    gameOver = true;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('sharkGameHighScore', highScore);
    }

    const gameOverMessage = 
        '終了！\n' +
        'スコア: ' + score + '匹\n' +
        'タップしてリトライ';
    
    gameOverText = this.add.text(
        config.width / 2,
        config.height / 2,
        gameOverMessage,
        {
            fontSize: '32px',
            fill: '#fff',
            align: 'center'
        }
    ).setOrigin(0.5);

    this.input.on('pointerdown', () => restartGame.call(this));
    fishes.clear(true, true);
}

function restartGame() {
    gameOver = false;
    gameStarted = false;
    score = 0;
    timeLeft = 30;
    
    if (gameOverText) gameOverText.destroy();
    if (shark) shark.destroy();
    if (scoreText) scoreText.destroy();
    if (timeText) timeText.destroy();
    if (highScoreText) highScoreText.destroy();
    
    fishes.clear(true, true);
    createStartScreen.call(this);
}

function updateHighScoreText() {
    if (highScoreText) {
        highScoreText.destroy();
    }
    
    highScoreText = this.add.text(
        config.width - 16,
        16,
        'ハイスコア: ' + highScore + '匹',
        {
            fontSize: '24px',
            fill: '#fff'
        }
    ).setOrigin(1, 0);
    
    startScreen.add(highScoreText);
}
