// =====================================================
// TETRIS
// 10 × 20
// =====================================================


// =====================================================
// Canvas
// =====================================================

const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const startBtn = document.getElementById("start-btn");


// 1マス = 20px
context.scale(20, 20);


// =====================================================
// HOLD / NEXT
// =====================================================

const holdCanvas = document.getElementById("hold");
const holdContext = holdCanvas.getContext("2d");

const nextCanvases = [
    document.getElementById("next1"),
    document.getElementById("next2"),
    document.getElementById("next3"),
    document.getElementById("next4"),
    document.getElementById("next5")
];

const nextContexts = nextCanvases.map(canvas => {
    return canvas.getContext("2d");
});


// =====================================================
// 色
// =====================================================

const colors = [
    null,
    "#00ccff", // I
    "#ff8800", // L
    "#0004f8", // J
    "#ffe600", // O
    "#ff0000", // Z
    "#15ff00", // S
    "#e100ff"  // T
];


// =====================================================
// ピース種類
// =====================================================

const pieceTypes = [
    "I",
    "L",
    "J",
    "O",
    "Z",
    "S",
    "T"
];


// =====================================================
// 7-Bag
// =====================================================

let pieceBag = [];
let nextQueue = [];


// =====================================================
// HOLD
// =====================================================

let holdPiece = null;
let holdUsed = false;


// =====================================================
// プレイヤー
// =====================================================

const player = {

    pos: {
        x: 0,
        y: 0
    },

    matrix: null,

    type: null,

    score: 0
};


// =====================================================
// ゲーム状態
// =====================================================

let gameOver = true;


// =====================================================
// 落下
// =====================================================

let dropCounter = 0;

// 通常落下速度
let dropInterval = 1000;

// ↓を押したとき
const softDropInterval = 35;


// =====================================================
// 設置待ち
// =====================================================

// 地面に着いてから固定するまで
const lockDelay = 500;

let lockCounter = 0;

let isGrounded = false;


// =====================================================
// 操作感
// =====================================================

// 左右長押し
const DAS = 120;
const ARR = 35;

// キー状態
const keys = {
    left: false,
    right: false,
    down: false
};

// 左右移動方向
let horizontalDirection = 0;

// 左右移動タイマー
let horizontalTimer = 0;

// 最初の長押しかどうか
let horizontalInitial = true;

// ソフトドロップタイマー
let softDropTimer = 0;


// =====================================================
// Tスピン
// =====================================================

// 最後の操作が回転だったか
let lastActionWasRotate = false;

// Tスピン候補
let tSpinPossible = false;


// =====================================================
// パーティクル
// =====================================================

class Particle {

    constructor(x, y, color) {

        this.x = x;
        this.y = y;

        this.vx =
            (Math.random() - 0.5) * 0.3;

        this.vy =
            (Math.random() - 0.5) * 0.3 - 0.1;

        this.life = 1;

        this.decay = 0.02;

        this.size =
            Math.random() * 0.3 + 0.1;

        this.color = color;
    }


    update() {

        this.x += this.vx;

        this.y += this.vy;

        this.vy += 0.01;

        this.life -= this.decay;
    }


    draw(ctx) {

        ctx.save();

        ctx.globalAlpha = this.life;

        ctx.fillStyle = this.color;

        ctx.shadowBlur = 0.3;

        ctx.shadowColor = this.color;

        ctx.fillRect(
            this.x,
            this.y,
            this.size,
            this.size
        );

        ctx.restore();
    }
}


const particles = [];


// =====================================================
// ライン消去
// =====================================================

let clearingRows = [];

let clearAnimation = 0;


// =====================================================
// 画面揺れ
// =====================================================

let screenShake = {
    x: 0,
    y: 0,
    intensity: 0
};


// =====================================================
// 表示テキスト
// =====================================================

let comboText = {
    text: "",
    alpha: 0,
    y: 10
};


// =====================================================
// 盤面
// =====================================================

const arena = createMatrix(10, 20);


// =====================================================
// 盤面作成
// =====================================================

function createMatrix(w, h) {

    const matrix = [];

    while (h--) {

        matrix.push(
            new Array(w).fill(0)
        );
    }

    return matrix;
}


// =====================================================
// テトリミノ作成
// =====================================================

function createPiece(type) {

    if (type === "I") {

        return [

            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]

        ];
    }


    if (type === "L") {

        return [

            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2]

        ];
    }


    if (type === "J") {

        return [

            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0]

        ];
    }


    if (type === "O") {

        return [

            [4, 4],
            [4, 4]

        ];
    }


    if (type === "Z") {

        return [

            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0]

        ];
    }


    if (type === "S") {

        return [

            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0]

        ];
    }


    if (type === "T") {

        return [

            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0]

        ];
    }
}


// =====================================================
// 7-Bag シャッフル
// =====================================================

function shuffleBag() {

    const bag = [...pieceTypes];

    for (
        let i = bag.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            bag[i],
            bag[j]
        ] = [
            bag[j],
            bag[i]
        ];
    }

    return bag;
}


// =====================================================
// 次のピース取得
// =====================================================

function getNextPieceType() {

    if (pieceBag.length === 0) {

        pieceBag = shuffleBag();
    }

    return pieceBag.shift();
}


// =====================================================
// NEXT補充
// =====================================================

function fillNextQueue() {

    while (nextQueue.length < 5) {

        nextQueue.push(
            getNextPieceType()
        );
    }
}


// =====================================================
// NEXTから取り出す
// =====================================================

function getNextFromQueue() {

    fillNextQueue();

    const type =
        nextQueue.shift();

    fillNextQueue();

    return type;
}


// =====================================================
// 衝突判定
// =====================================================

function collide(arena, player) {

    const matrix = player.matrix;
    const offset = player.pos;


    for (
        let y = 0;
        y < matrix.length;
        y++
    ) {

        for (
            let x = 0;
            x < matrix[y].length;
            x++
        ) {

            if (
                matrix[y][x] !== 0
            ) {

                const boardY =
                    y + offset.y;

                const boardX =
                    x + offset.x;


                // 左右・下の壁
                if (
                    boardX < 0 ||
                    boardX >= arena[0].length ||
                    boardY >= arena.length
                ) {

                    return true;
                }


                // 上から出ている場合
                if (boardY < 0) {
                    continue;
                }


                // ブロックにぶつかった
                if (
                    arena[boardY][boardX] !== 0
                ) {

                    return true;
                }
            }
        }
    }


    return false;
}


// =====================================================
// ブロックを盤面に固定
// =====================================================

function merge(arena, player) {

    player.matrix.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

                    if (value !== 0) {

                        const boardX =
                            x + player.pos.x;

                        const boardY =
                            y + player.pos.y;


                        // 盤面外なら無視
                        if (
                            boardY < 0 ||
                            boardY >= arena.length ||
                            boardX < 0 ||
                            boardX >= arena[0].length
                        ) {

                            return;
                        }


                        arena[boardY][boardX] =
                            value;


                        // パーティクル
                        for (
                            let i = 0;
                            i < 3;
                            i++
                        ) {

                            particles.push(

                                new Particle(

                                    boardX + 0.5,
                                    boardY + 0.5,
                                    colors[value]
                                )
                            );
                        }
                    }
                }
            );
        }
    );


    screenShake.intensity = 0.05;
}


// =====================================================
// Tスピン判定
// =====================================================

function checkTSpin() {

    // Tミノじゃない
    if (player.type !== "T") {
        return false;
    }


    // 最後が回転じゃない
    if (!lastActionWasRotate) {
        return false;
    }


    const centerX =
        player.pos.x + 1;

    const centerY =
        player.pos.y + 1;


    const corners = [

        [
            centerX - 1,
            centerY - 1
        ],

        [
            centerX + 1,
            centerY - 1
        ],

        [
            centerX - 1,
            centerY + 1
        ],

        [
            centerX + 1,
            centerY + 1
        ]

    ];


    let blockedCorners = 0;


    corners.forEach(
        ([x, y]) => {

            // 壁
            if (
                x < 0 ||
                x >= arena[0].length ||
                y < 0 ||
                y >= arena.length
            ) {

                blockedCorners++;

                return;
            }


            // ブロック
            if (
                arena[y][x] !== 0
            ) {

                blockedCorners++;
            }
        }
    );


    return blockedCorners >= 3;
}


// =====================================================
// ピース回転
// =====================================================

function rotate(matrix, dir) {

    // 転置
    for (
        let y = 0;
        y < matrix.length;
        y++
    ) {

        for (
            let x = 0;
            x < y;
            x++
        ) {

            [
                matrix[x][y],
                matrix[y][x]

            ] = [

                matrix[y][x],
                matrix[x][y]
            ];
        }
    }


    // 右回転
    if (dir > 0) {

        matrix.forEach(
            row => row.reverse()
        );
    }

    // 左回転
    else {

        matrix.reverse();
    }
}


// =====================================================
// プレイヤー回転
// =====================================================

function playerRotate(dir) {

    const originalX =
        player.pos.x;


    let offset = 1;


    rotate(
        player.matrix,
        dir
    );


    // 壁際の回転を少し補助
    while (
        collide(
            arena,
            player
        )
    ) {

        player.pos.x += offset;


        offset =
            -(
                offset +
                (
                    offset > 0
                        ? 1
                        : -1
                )
            );


        if (
            Math.abs(offset) >
            player.matrix[0].length
        ) {

            // 回転失敗
            rotate(
                player.matrix,
                -dir
            );


            player.pos.x =
                originalX;


            return;
        }
    }


    // 回転成功
    lastActionWasRotate = true;


    if (player.type === "T") {

        tSpinPossible = true;
    }


    // 地面で回転したら設置時間をリセット
    if (isGrounded) {

        lockCounter = 0;
    }
}


// =====================================================
// 左右移動
// =====================================================

function playerMove(dir) {

    player.pos.x += dir;


    if (
        collide(
            arena,
            player
        )
    ) {

        player.pos.x -= dir;

        return;
    }


    // 回転後に移動したら
    // Tスピン判定を解除
    lastActionWasRotate = false;

    tSpinPossible = false;


    // 接地中なら設置待ちをリセット
    if (isGrounded) {

        lockCounter = 0;
    }
}


// =====================================================
// 通常落下
// =====================================================

function playerDrop() {

    player.pos.y++;


    if (
        collide(
            arena,
            player
        )
    ) {

        player.pos.y--;


        if (!isGrounded) {

            isGrounded = true;

            lockCounter = 0;
        }


        return;
    }


    isGrounded = false;

    lockCounter = 0;

    dropCounter = 0;
}


// =====================================================
// ハードドロップ
// =====================================================

function playerHardDrop() {

    while (
        !collide(
            arena,
            player
        )
    ) {

        player.pos.y++;
    }


    player.pos.y--;


    // 即固定
    lockPiece();


    dropCounter = 0;
}


// =====================================================
// ラインが揃っているか調べる
// =====================================================

function arenaSweep() {

    clearingRows = [];


    for (
        let y = arena.length - 1;
        y >= 0;
        y--
    ) {

        let full = true;


        for (
            let x = 0;
            x < arena[y].length;
            x++
        ) {

            if (
                arena[y][x] === 0
            ) {

                full = false;

                break;
            }
        }


        if (full) {

            clearingRows.push(y);
        }
    }


    if (clearingRows.length === 0) {

        return;
    }


    clearAnimation = 30;


    screenShake.intensity =
        0.2 +
        clearingRows.length * 0.1;


    const normalTexts = [

        "SINGLE!",
        "DOUBLE!",
        "TRIPLE!",
        "TETRIS!"

    ];


    comboText.text =
        normalTexts[
            Math.min(
                clearingRows.length - 1,
                3
            )
        ];


    comboText.alpha = 1;

    comboText.y = 10;


    // パーティクル
    clearingRows.forEach(
        y => {

            for (
                let x = 0;
                x < arena[y].length;
                x++
            ) {

                const color =
                    colors[
                        arena[y][x]
                    ];


                for (
                    let i = 0;
                    i < 8;
                    i++
                ) {

                    particles.push(

                        new Particle(

                            x + 0.5,
                            y + 0.5,
                            color
                        )
                    );
                }
            }
        }
    );
}


// =====================================================
// ライン消去完了
// =====================================================

function completeClearRows() {

    const rows =
        [...clearingRows]
            .sort(
                (a, b) => b - a
            );


    rows.forEach(
        y => {

            arena.splice(
                y,
                1
            );
        }
    );


    rows.forEach(
        () => {

            arena.unshift(
                new Array(10).fill(0)
            );
        }
    );


    clearingRows = [];
}


// =====================================================
// ピース固定
// =====================================================

function lockPiece() {

    const isTSpin =
        checkTSpin();


    // まず盤面に固定
    merge(
        arena,
        player
    );


    // ライン消去判定
    arenaSweep();


    // =================================================
    // Tスピン
    // =================================================

    if (isTSpin) {

        const lineCount =
            clearingRows.length;


        let text = "";
        let bonus = 0;


        if (lineCount === 0) {

            text = "T-SPIN!";
            bonus = 400;
        }

        else if (lineCount === 1) {

            text = "T-SPIN SINGLE!";
            bonus = 800;
        }

        else if (lineCount === 2) {

            text = "T-SPIN DOUBLE!";
            bonus = 1200;
        }

        else if (lineCount === 3) {

            text = "T-SPIN TRIPLE!";
            bonus = 1600;
        }


        player.score += bonus;


        comboText.text =
            text;

        comboText.alpha = 1;

        comboText.y = 8;


        screenShake.intensity =
            0.4;


        // Tスピン専用パーティクル
        for (
            let i = 0;
            i < 25;
            i++
        ) {

            particles.push(

                new Particle(

                    player.pos.x + 1,
                    player.pos.y + 1,
                    "#e100ff"
                )
            );
        }
    }


    // 次のピースへ
    playerReset();


    updateScore();


    isGrounded = false;

    lockCounter = 0;

    lastActionWasRotate = false;

    tSpinPossible = false;
}


// =====================================================
// プレイヤーリセット
// =====================================================

function playerReset() {

    const type =
        getNextFromQueue();


    player.type =
        type;


    player.matrix =
        createPiece(type);


    player.pos.y = 0;


    player.pos.x =
        Math.floor(
            (
                arena[0].length -
                player.matrix[0].length
            ) / 2
        );


    holdUsed = false;


    isGrounded = false;

    lockCounter = 0;


    lastActionWasRotate = false;

    tSpinPossible = false;


    // ゲームオーバー判定
    if (
        collide(
            arena,
            player
        )
    ) {

        gameOver = true;

        startBtn.innerText =
            "GAME OVER - RESTART";

        startBtn.style.display =
            "block";
    }


    updatePreview();
}


// =====================================================
// HOLD
// =====================================================

function playerHold() {

    // 1ピースにつき1回
    if (holdUsed) {

        return;
    }


    const currentType =
        player.type;


    // 初めてHOLD
    if (holdPiece === null) {

        holdPiece =
            currentType;


        const nextType =
            getNextFromQueue();


        player.type =
            nextType;


        player.matrix =
            createPiece(nextType);
    }

    // すでにHOLDがある
    else {

        const temp =
            holdPiece;


        holdPiece =
            currentType;


        player.type =
            temp;


        player.matrix =
            createPiece(temp);
    }


    // 上に戻す
    player.pos.y = 0;


    player.pos.x =
        Math.floor(
            (
                arena[0].length -
                player.matrix[0].length
            ) / 2
        );


    holdUsed = true;


    // Tスピン状態リセット
    lastActionWasRotate = false;

    tSpinPossible = false;


    isGrounded = false;

    lockCounter = 0;


    updatePreview();
}


// =====================================================
// ミニピース描画
// =====================================================

function drawMiniPiece(ctx, type) {

    ctx.clearRect(
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
    );


    if (!type) {

        return;
    }


    const matrix =
        createPiece(type);


    const blockSize = 18;


    const pieceWidth =
        matrix[0].length *
        blockSize;


    const pieceHeight =
        matrix.length *
        blockSize;


    const offsetX =
        (
            ctx.canvas.width -
            pieceWidth
        ) / 2;


    const offsetY =
        (
            ctx.canvas.height -
            pieceHeight
        ) / 2;


    matrix.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

                    if (value === 0) {

                        return;
                    }


                    const px =
                        offsetX +
                        x * blockSize;


                    const py =
                        offsetY +
                        y * blockSize;


                    ctx.save();


                    ctx.fillStyle =
                        colors[value];


                    ctx.shadowBlur = 8;

                    ctx.shadowColor =
                        colors[value];


                    ctx.fillRect(
                        px,
                        py,
                        blockSize,
                        blockSize
                    );


                    ctx.restore();


                    ctx.strokeStyle =
                        "rgba(255,255,255,0.5)";

                    ctx.lineWidth = 1;


                    ctx.strokeRect(
                        px,
                        py,
                        blockSize,
                        blockSize
                    );
                }
            );
        }
    );
}


// =====================================================
// HOLD表示
// =====================================================

function updateHoldDisplay() {

    drawMiniPiece(
        holdContext,
        holdPiece
    );
}


// =====================================================
// NEXT表示
// =====================================================

function updateNextDisplay() {

    fillNextQueue();


    for (
        let i = 0;
        i < 5;
        i++
    ) {

        drawMiniPiece(
            nextContexts[i],
            nextQueue[i]
        );
    }
}


// =====================================================
// プレビュー更新
// =====================================================

function updatePreview() {

    updateHoldDisplay();

    updateNextDisplay();
}


// =====================================================
// メイン描画
// =====================================================

function draw() {

    context.save();


    // 画面揺れ
    if (
        screenShake.intensity > 0
    ) {

        screenShake.x =
            (
                Math.random() - 0.5
            ) *
            screenShake.intensity;


        screenShake.y =
            (
                Math.random() - 0.5
            ) *
            screenShake.intensity;


        context.translate(
            screenShake.x,
            screenShake.y
        );


        screenShake.intensity *= 0.9;


        if (
            screenShake.intensity < 0.001
        ) {

            screenShake.intensity = 0;
        }
    }


    // 背景
    context.fillStyle = "#000";


    context.fillRect(
        0,
        0,
        10,
        20
    );


    // マス目
    context.lineWidth = 0.05;

    context.strokeStyle = "#333";


    for (
        let x = 0;
        x <= 10;
        x++
    ) {

        context.beginPath();

        context.moveTo(x, 0);

        context.lineTo(x, 20);

        context.stroke();
    }


    for (
        let y = 0;
        y <= 20;
        y++
    ) {

        context.beginPath();

        context.moveTo(0, y);

        context.lineTo(10, y);

        context.stroke();
    }


    // 固定ブロック
    drawMatrix(
        arena,
        {
            x: 0,
            y: 0
        }
    );


    // 現在のピース
    if (
        player.matrix
    ) {

        drawMatrix(
            player.matrix,
            player.pos
        );
    }


    // ライン消去演出
    if (
        clearAnimation > 0
    ) {

        const flash =
            Math.sin(
                clearAnimation * 0.5
            ) * 0.5 + 0.5;


        clearingRows.forEach(
            y => {

                context.save();

                context.globalAlpha =
                    flash;

                context.fillStyle =
                    "#ffffff";


                context.fillRect(
                    0,
                    y,
                    10,
                    1
                );


                context.restore();
            }
        );
    }


    // パーティクル
    particles.forEach(
        particle => {

            particle.draw(context);
        }
    );


    // 表示テキスト
    if (
        comboText.alpha > 0
    ) {

        context.save();

        context.globalAlpha =
            comboText.alpha;

        context.fillStyle =
            "#FFD700";

        context.shadowBlur =
            0.5;

        context.shadowColor =
            "#FFD700";


        context.font =
            "bold 1px Arial";

        context.textAlign =
            "center";


        context.fillText(
            comboText.text,
            5,
            comboText.y
        );


        context.restore();
    }


    context.restore();
}


// =====================================================
// ブロック描画
// =====================================================

function drawMatrix(matrix, offset) {

    matrix.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

                    if (value === 0) {

                        return;
                    }


                    const px =
                        x + offset.x;

                    const py =
                        y + offset.y;


                    // 画面外は描画しない
                    if (
                        px < 0 ||
                        px >= 10 ||
                        py < 0 ||
                        py >= 20
                    ) {

                        return;
                    }


                    context.save();


                    context.fillStyle =
                        colors[value];


                    context.shadowBlur =
                        0.5;

                    context.shadowColor =
                        colors[value];


                    context.fillRect(
                        px,
                        py,
                        1,
                        1
                    );


                    context.restore();


                    // 枠
                    context.lineWidth =
                        0.05;

                    context.strokeStyle =
                        "rgba(255,255,255,0.5)";


                    context.strokeRect(
                        px,
                        py,
                        1,
                        1
                    );


                    // ハイライト
                    context.fillStyle =
                        "rgba(255,255,255,0.3)";


                    context.fillRect(
                        px + 0.1,
                        py + 0.1,
                        0.3,
                        0.3
                    );
                }
            );
        }
    );
}


// =====================================================
// スコア
// =====================================================

function updateScore() {

    scoreElement.innerText =
        player.score;
}


// =====================================================
// ゲーム更新
// =====================================================

let lastTime = 0;


function update(time = 0) {

    if (gameOver) {

        draw();

        return;
    }


    const deltaTime =
        time - lastTime;


    lastTime = time;


    // =================================================
    // パーティクル
    // =================================================

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        particles[i].update();


        if (
            particles[i].life <= 0
        ) {

            particles.splice(
                i,
                1
            );
        }
    }


    // =================================================
    // 表示テキスト
    // =================================================

    if (
        comboText.alpha > 0
    ) {

        comboText.alpha -=
            0.015;

        comboText.y -=
            0.05;
    }


    // =================================================
    // ライン消去
    // =================================================

    if (
        clearAnimation > 0
    ) {

        clearAnimation--;


        if (
            clearAnimation === 0
        ) {

            completeClearRows();

            updateScore();
        }
    }


    else {

        // =================================================
        // 左右長押し
        // =================================================

        if (
            horizontalDirection !== 0
        ) {

            horizontalTimer +=
                deltaTime;


            const waitTime =
                horizontalInitial
                    ? DAS
                    : ARR;


            if (
                horizontalTimer >=
                waitTime
            ) {

                horizontalTimer = 0;

                horizontalInitial = false;


                playerMove(
                    horizontalDirection
                );
            }
        }


        // =================================================
        // 空中
        // =================================================

        if (!isGrounded) {

            dropCounter +=
                deltaTime;


            // ↓を押している
            if (keys.down) {

                softDropTimer +=
                    deltaTime;


                if (
                    softDropTimer >=
                    softDropInterval
                ) {

                    softDropTimer = 0;

                    playerDrop();
                }
            }


            // 通常落下
            else {

                if (
                    dropCounter >=
                    dropInterval
                ) {

                    dropCounter = 0;

                    playerDrop();
                }
            }
        }


        // =================================================
        // 接地中
        // =================================================

        else {

            lockCounter +=
                deltaTime;


            if (
                lockCounter >=
                lockDelay
            ) {

                lockPiece();
            }
        }
    }


    // =================================================
    // 描画
    // =================================================

    draw();


    requestAnimationFrame(
        update
    );
}


// =====================================================
// キー入力
// =====================================================

document.addEventListener(
    "keydown",
    event => {

        if (gameOver) {

            return;
        }


        // =============================================
        // 左
        // =============================================

        if (
            event.code ===
            "ArrowLeft"
        ) {

            event.preventDefault();


            if (!keys.left) {

                keys.left = true;

                horizontalDirection = -1;

                horizontalTimer = 0;

                horizontalInitial = true;


                // 押した瞬間
                playerMove(-1);
            }
        }


        // =============================================
        // 右
        // =============================================

        else if (
            event.code ===
            "ArrowRight"
        ) {

            event.preventDefault();


            if (!keys.right) {

                keys.right = true;

                horizontalDirection = 1;

                horizontalTimer = 0;

                horizontalInitial = true;


                // 押した瞬間
                playerMove(1);
            }
        }


        // =============================================
        // 下
        // =============================================

        else if (
            event.code ===
            "ArrowDown"
        ) {

            event.preventDefault();


            if (!keys.down) {

                keys.down = true;

                softDropTimer = 0;


                // 押した瞬間に1マス
                playerDrop();
            }
        }


        // =============================================
        // ↑ 右回転
        // =============================================

        else if (
            event.code ===
            "ArrowUp"
        ) {

            event.preventDefault();

            playerRotate(1);
        }


        // =============================================
        // X 右回転
        // =============================================

        else if (
            event.code ===
            "KeyX"
        ) {

            event.preventDefault();

            playerRotate(1);
        }


        // =============================================
        // Z 左回転
        // =============================================

        else if (
            event.code ===
            "KeyZ"
        ) {

            event.preventDefault();

            playerRotate(-1);
        }


        // =============================================
        // Space ハードドロップ
        // =============================================

        else if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            playerHardDrop();
        }


        // =============================================
        // C HOLD
        // =============================================

        else if (
            event.code ===
            "KeyC"
        ) {

            event.preventDefault();

            playerHold();
        }
    }
);


// =====================================================
// キーを離したとき
// =====================================================

document.addEventListener(
    "keyup",
    event => {

        // 左
        if (
            event.code ===
            "ArrowLeft"
        ) {

            keys.left = false;


            if (
                horizontalDirection === -1
            ) {

                horizontalDirection = 0;

                horizontalTimer = 0;
            }
        }


        // 右
        else if (
            event.code ===
            "ArrowRight"
        ) {

            keys.right = false;


            if (
                horizontalDirection === 1
            ) {

                horizontalDirection = 0;

                horizontalTimer = 0;
            }
        }


        // 下
        else if (
            event.code ===
            "ArrowDown"
        ) {

            keys.down = false;

            softDropTimer = 0;
        }
    }
);


// =====================================================
// スタートボタン
// =====================================================

startBtn.addEventListener(
    "click",
    () => {

        // 盤面を空にする
        arena.forEach(
            row => row.fill(0)
        );


        // スコア
        player.score = 0;

        updateScore();


        // 7-Bagリセット
        pieceBag = [];

        nextQueue = [];


        // HOLDリセット
        holdPiece = null;

        holdUsed = false;


        // 操作状態リセット
        keys.left = false;

        keys.right = false;

        keys.down = false;


        horizontalDirection = 0;

        horizontalTimer = 0;

        horizontalInitial = true;

        softDropTimer = 0;


        // 設置状態
        isGrounded = false;

        lockCounter = 0;


        // Tスピン
        lastActionWasRotate = false;

        tSpinPossible = false;


        // 演出
        particles.length = 0;

        clearingRows = [];

        clearAnimation = 0;

        comboText.alpha = 0;

        screenShake.intensity = 0;


        // NEXT
        fillNextQueue();


        // ゲーム開始
        gameOver = false;


        // 最初のピース
        playerReset();


        // ボタン非表示
        startBtn.style.display =
            "none";


        // タイマー
        lastTime = performance.now();

        dropCounter = 0;


        // ゲーム開始
        requestAnimationFrame(
            update
        );
    }
);


// =====================================================
// 初期表示
// =====================================================

fillNextQueue();

updatePreview();

draw();

// =====================================================
// スマホ操作ボタン
// PCのキーボード操作と同じ処理を呼び出す
// =====================================================

const touchButtons =
    document.querySelectorAll(".touch-btn");


touchButtons.forEach(button => {

    const key =
        button.dataset.key;


    // ---------------------------------------------
    // タップ
    // ---------------------------------------------

    button.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();


            if (gameOver) {
                return;
            }


            // 左
            if (key === "ArrowLeft") {

                if (!keys.left) {

                    keys.left = true;

                    horizontalDirection = -1;

                    horizontalTimer = 0;

                    horizontalInitial = true;

                    playerMove(-1);
                }
            }


            // 右
            else if (key === "ArrowRight") {

                if (!keys.right) {

                    keys.right = true;

                    horizontalDirection = 1;

                    horizontalTimer = 0;

                    horizontalInitial = true;

                    playerMove(1);
                }
            }


            // 下
            else if (key === "ArrowDown") {

                keys.down = true;

                softDropTimer = 0;

                playerDrop();
            }


            // 上
            else if (key === "ArrowUp") {

                playerRotate(1);
            }


            // Z
            else if (key === "KeyZ") {

                playerRotate(-1);
            }


            // X
            else if (key === "KeyX") {

                playerRotate(1);
            }


            // Space
            else if (key === "Space") {

                playerHardDrop();
            }


            // C
            else if (key === "KeyC") {

                playerHold();
            }
        }
    );


    // ---------------------------------------------
    // ボタンを離した
    // ---------------------------------------------

    button.addEventListener(
        "pointerup",
        event => {

            event.preventDefault();

            releaseTouchKey(key);
        }
    );


    button.addEventListener(
        "pointercancel",
        event => {

            event.preventDefault();

            releaseTouchKey(key);
        }
    );


    button.addEventListener(
        "pointerleave",
        event => {

            if (
                event.buttons === 0
            ) {

                releaseTouchKey(key);
            }
        }
    );
});


// =====================================================
// スマホボタンを離した処理
// =====================================================

function releaseTouchKey(key) {

    if (key === "ArrowLeft") {

        keys.left = false;

        if (
            horizontalDirection === -1
        ) {

            horizontalDirection = 0;

            horizontalTimer = 0;
        }
    }


    else if (key === "ArrowRight") {

        keys.right = false;

        if (
            horizontalDirection === 1
        ) {

            horizontalDirection = 0;

            horizontalTimer = 0;
        }
    }


    else if (key === "ArrowDown") {

        keys.down = false;

        softDropTimer = 0;
    }
}