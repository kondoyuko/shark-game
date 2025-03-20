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

// Google FormsのURL（実際のURLに置き換えてください）
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse';

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
        preload: preload,
        create: create,
        update: update
    }
};

// ゲームインスタンスの作成
window.addEventListener('load', () => {
    game = new Phaser.Game(config);
});

function preload() {
    // アセットのロード
    this.load.image('shark', 'assets/shark.png');
    this.load.image('fish', 'assets/fish.png');
}

function createStartScreen() {
    startScreen = this.add.group();

    const titleText = this.add.text(400, 120, 'Wedding Shark Game', {
        fontSize: '48px',
        fill: '#fff',
        align: 'center'
    });
    titleText.setOrigin(0.5);

    const emojiText = this.add.text(400, 225, '👰 🦈 🤵', {
        fontSize: '72px',
        align: 'center',
        padding: { x: 32, y: 32 }
    });
    emojiText.setOrigin(0.5);

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const controlsText = isMobile ? 
        'タップ＆ドラッグでシャーくんを動かして\n30秒以内にたくさんの魚を食べよう！' :
        '矢印キーでシャーくんを動かして\n30秒以内にたくさんの魚を食べよう！';
    
    const instructionText = this.add.text(400, 330, controlsText, {
        fontSize: '24px',
        fill: '#fff',
        align: 'center'
    });
    instructionText.setOrigin(0.5);

    startScreen.add(titleText);
    startScreen.add(emojiText);
    startScreen.add(instructionText);

    // ハイスコアを右下に表示
    updateHighScoreText.call(this);
}

function create() {
    this.input.on('pointerdown', () => {
        if (!gameStarted) {
            startGame.call(this);
        } else if (gameOver) {
            restartGame.call(this);
        }
    });

    this.input.keyboard.on('keydown', () => {
        if (!gameStarted) {
            startGame.call(this);
        } else if (gameOver) {
            restartGame.call(this);
        }
    });

    createStartScreen.call(this);

    // カーソルキーの設定
    this.cursors = this.input.keyboard.createCursorKeys();

    // タッチ操作の初期化
    this.touchStartPos = null;
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

    this.input.on('pointerdown', (pointer) => {
        this.touchStartPos = { x: pointer.x, y: pointer.y };
    });

    this.input.on('pointerup', () => {
        this.touchStartPos = null;
    });
}

function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        startScreen.clear(true, true);
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
}

function initializeGameElements() {
    // サメの作成（一時的に絵文字を使用）
    shark = this.add.text(400, 225, '🦈', { 
        fontSize: '36px',
        padding: { x: 10, y: 10 }
    });
    this.physics.world.enable(shark);
    shark.body.setCollideWorldBounds(true);
    shark.setOrigin(0.5);

    // 魚グループの作成
    fishes = this.physics.add.group();

    // タイマーテキストの作成（上部に配置）
    timeText = this.add.text(16, 16, '残り時間: 30秒', {
        fontSize: '24px',
        fill: '#fff'
    });

    // スコアテキストの作成（タイマーの下に配置）
    scoreText = this.add.text(16, 56, '食べた魚: 0匹', {
        fontSize: '24px',
        fill: '#fff'
    });

    // ハイスコアを右下に表示
    updateHighScoreText.call(this);

    // ゲームオーバーテキストの作成（最初は非表示）
    gameOverText = this.add.text(400, 225, '', {
        fontSize: '48px',
        fill: '#ff0000',
        align: 'center'
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setVisible(false);

    // 衝突判定の設定
    this.physics.add.overlap(shark, fishes, collectFish, null, this);
}

function update() {
    if (gameOver || !gameStarted) return;

    // サメの移動
    if (this.cursors.left.isDown) {
        shark.x -= 5;
        shark.setScale(1, 1);  // 左向きのサメ
    } else if (this.cursors.right.isDown) {
        shark.x += 5;
        shark.setScale(-1, 1);  // 右向きのサメ
    }

    if (this.cursors.up.isDown) {
        shark.y -= 5;
    } else if (this.cursors.down.isDown) {
        shark.y += 5;
    }

    // 画面内に収める
    shark.x = Phaser.Math.Clamp(shark.x, 0, config.width);
    shark.y = Phaser.Math.Clamp(shark.y, 0, config.height);
}

function collectFish(shark, fish) {
    fish.destroy();
    score += 1;
    scoreText.setText('食べた魚: ' + score + '匹');
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('sharkGameHighScore', highScore);
        updateHighScoreText.call(this);
    }
}

function createFish() {
    if (!gameStarted || gameOver) return;

    const fishEmoji = '🐟';
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const x = side === 'left' ? -20 : config.width + 20;
    const y = Phaser.Math.Between(50, config.height - 50);
    
    const fish = this.add.text(x, y, fishEmoji, {
        fontSize: '32px'
    });
    
    this.physics.world.enable(fish);
    fishes.add(fish);
    
    const targetX = side === 'left' ? config.width + 100 : -100;
    const speed = Phaser.Math.Between(80, 300); // より広い範囲のランダムな速度
    const duration = side === 'left' ? 
        (config.width + 120) / speed * 1000 : 
        (config.width + 120) / speed * 1000;
    
    // 魚の向きを設定（進行方向に向かせる）
    fish.setScale(side === 'left' ? -1 : 1, 1);
    
    this.tweens.add({
        targets: fish,
        x: targetX,
        duration: duration,
        ease: 'Linear',
        onComplete: () => {
            fish.destroy();
        }
    });
}

function updateTimer() {
    if (!gameStarted || gameOver) return;

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
        localStorage.setItem('sharkGameHighScore', highScore.toString());
    }

    let gameOverMessage = '終了！\n';
    gameOverMessage += '食べた魚: ' + score + '匹\n';
    gameOverMessage += 'タップしてリトライ';
    
    gameOverText.setText(gameOverMessage);
    gameOverText.setVisible(true);

    fishes.clear(true, true);
}

function restartGame() {
    // 既存のテキストとオブジェクトをクリア
    if (timeText) timeText.destroy();
    if (scoreText) scoreText.destroy();
    if (highScoreText) highScoreText.destroy();
    if (gameOverText) gameOverText.destroy();
    if (shark) shark.destroy();
    if (fishes) fishes.clear(true, true);

    // ゲーム状態のリセット
    score = 0;
    timeLeft = 30;
    gameOver = false;
    gameStarted = false;

    // スタート画面の再作成
    createStartScreen.call(this);
}

// ハイスコアテキストを更新する関数
function updateHighScoreText() {
    if (highScoreText) {
        highScoreText.destroy();
    }
    
    highScoreText = this.add.text(config.width - 16, config.height - 16, 'ハイスコア: ' + highScore + '匹', {
        fontSize: '20px',
        fill: '#fff'
    });
    highScoreText.setOrigin(1, 1);
}

// フォーム送信処理
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registration-form');
    if (form) {
        // フォームのaction属性を設定
        form.setAttribute('action', GOOGLE_FORM_URL);
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // フォームデータの収集
            const formData = new FormData(form);
            
            // 送信ボタンを無効化
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = '送信中...';
            }

            // Google Forms APIエンドポイントへの送信
            fetch(GOOGLE_FORM_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams([...formData.entries()]).toString()
            })
            .then(() => {
                alert('ご回答ありがとうございます！');
                form.reset();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('エラーが発生しました。もう一度お試しください。');
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = '送信';
                }
            });
        });
    }
});
