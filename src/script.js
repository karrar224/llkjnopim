<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لعبة صيد الكنوز</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f0f0f0;
            font-family: Arial, sans-serif;
        }

        #game-container {
            position: relative;
            text-align: center;
        }

        canvas {
            border: 2px solid #000;
        }

        #score-board {
            position: absolute;
            top: 10px;
            left: 10px;
            font-size: 20px;
            color: #fff;
            font-weight: bold;
        }

        #startButton, #adButton {
            margin-top: 20px;
            padding: 10px 20px;
            font-size: 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            cursor: pointer;
        }

        #adButton {
            background-color: #FF5733;
        }

        #adButton:hover {
            background-color: #e04b29;
        }

        #cooldown-message {
            color: red;
            display: none;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <canvas id="gameCanvas"></canvas>
        <div id="score-board">
            <p>الأرواح المتبقية: <span id="lives">3</span></p>
            <p>جمع الكنوز: <span id="collectedCoins">0</span></p>
        </div>
        <button id="startButton">ابدأ اللعبة</button>
        <button id="adButton" style="display: none;">تخطي الانتظار</button>
        <p id="cooldown-message">الرجاء الانتظار 60 دقيقة للعب مرة أخرى!</p>
    </div>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 600;

        // تحميل الصور
        const playerImage = new Image();
        const coinImage = new Image();
        const dangerCoinImage = new Image();

        let imagesLoaded = 0;

        playerImage.src = 'https://i.imgur.com/W5RL74V.png';
        coinImage.src = 'https://i.imgur.com/qRhM0td.png';
        dangerCoinImage.src = 'https://i.imgur.com/3oEythm.png';

        // التحقق من تحميل الصور
        function checkImagesLoaded() {
            imagesLoaded++;
            if (imagesLoaded === 3) {
                document.getElementById('startButton').style.display = 'inline'; // إظهار زر البدء عندما تكون الصور جاهزة
            }
        }

        playerImage.onload = checkImagesLoaded;
        coinImage.onload = checkImagesLoaded;
        dangerCoinImage.onload = checkImagesLoaded;

        // اللاعب
        const player = {
            x: 100,
            y: 100,
            width: 50,
            height: 50,
            speed: 5,
            dx: 0,
            dy: 0
        };

        // المتغيرات العامة
        const treasures = [];
        const treasureSize = 30;
        let score = 0;
        let collectedCoins = 0;
        let lives = 3;
        let isCooldown = false;
        let cooldownEndTime = 0;
        let gameStarted = false;
        let fallingCoins = [];
        let dangerousCoins = [];

        // إنشاء الكنوز عشوائيًا
        function generateTreasures() {
            for (let i = 0; i < 5; i++) {
                let coin = {
                    x: Math.random() * (canvas.width - 30),
                    y: 0,
                    width: 30,
                    height: 30,
                    collected: false,
                    isDanger: Math.random() < 0.3 // 30% chance أن يكون الكنز خطر
                };
                if (coin.isDanger) {
                    dangerousCoins.push(coin); // إضافة الكنز الخطير
                } else {
                    fallingCoins.push(coin); // إضافة الكنز العادي
                }
            }
        }

        // تحديث موقع اللاعب
        function movePlayer() {
            player.x += player.dx;
            player.y += player.dy;

            if (player.x < 0) player.x = 0;
            if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
            if (player.y < 0) player.y = 0;
            if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
        }

        // رسم اللاعب
        function drawPlayer() {
            ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
        }

        // رسم الكنوز المتساقطة
        function drawFallingCoins() {
            fallingCoins.forEach(coin => {
                if (!coin.collected) {
                    ctx.drawImage(coinImage, coin.x, coin.y, coin.width, coin.height);
                }
            });
            dangerousCoins.forEach(coin => {
                if (!coin.collected) {
                    ctx.drawImage(dangerCoinImage, coin.x, coin.y, coin.width, coin.height); // رسم الكنز الخطير
                }
            });
        }

        // التحقق من الاصطدام مع الكنوز
        function checkCollisions() {
            fallingCoins.forEach(coin => {
                if (!coin.collected &&
                    player.x < coin.x + coin.width &&
                    player.x + player.width > coin.x &&
                    player.y < coin.y + coin.height &&
                    player.y + player.height > coin.y) {
                    coin.collected = true;
                    collectedCoins++;
                    document.getElementById('collectedCoins').textContent = collectedCoins;
                }
            });

            dangerousCoins.forEach(coin => {
                if (!coin.collected &&
                    player.x < coin.x + coin.width &&
                    player.x + player.width > coin.x &&
                    player.y < coin.y + coin.height &&
                    player.y + player.height > coin.y) {
                    coin.collected = true;
                    lives--;
                    document.getElementById('lives').textContent = lives;
                    if (lives <= 0) {
                        isCooldown = true;
                        cooldownEndTime = Date.now() + 60 * 60 * 1000; // 60 دقيقة
                        document.getElementById('cooldown-message').style.display = 'block';
                    }
                }
            });
        }

        // التعامل مع المدخلات (الأسهم واللمس)
        document.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowUp') player.dy = -player.speed;
            if (e.key === 'ArrowDown') player.dy = player.speed;
            if (e.key === 'ArrowLeft') player.dx = -player.speed;
            if (e.key === 'ArrowRight') player.dx = player.speed;
        });

        document.addEventListener('keyup', function (e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') player.dy = 0;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') player.dx = 0;
        });

        // إضافة دعم اللمس
        let touchStartX = 0;
        let touchStartY = 0;

        canvas.addEventListener('touchstart', function (e) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        canvas.addEventListener('touchmove', function (e) {
            let touchEndX = e.touches[0].clientX;
            let touchEndY = e.touches[0].clientY;

            let diffX = touchEndX - touchStartX;
            let diffY = touchEndY - touchStartY;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                player.dx = diffX > 0 ? player.speed : -player.speed;
                player.dy = 0;
            } else {
                player.dy = diffY > 0 ? player.speed : -player.speed;
                player.dx = 0;
            }
        });

        canvas.addEventListener('touchend', function () {
            player.dx = 0;
            player.dy = 0;
        });

        // التحقق من العد التنازلي
        function checkCooldown() {
            if (isCooldown) {
                const currentTime = Date.now();
                if (currentTime >= cooldownEndTime) {
                    isCooldown = false;
                    document.getElementById('cooldown-message').style.display = 'none';
                    lives = 3;
                    document.getElementById('lives').textContent = lives;
                }
            }
        }

        // بدء اللعبة
        document.getElementById('startButton').addEventListener('click', startGame);

        function startGame() {
            if (gameStarted) return;
            gameStarted = true;
            document.getElementById('startButton').style.display = 'none';
            generateTreasures();
            updateGame();
        }

        // تحديث اللعبة بشكل مستمر
        function updateGame() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!isCooldown) {
                movePlayer();
                drawPlayer();
                drawFallingCoins();
                checkCollisions();
            }

            checkCooldown(); // التحقق من الانتظار إذا انتهت الأرواح

            requestAnimationFrame(updateGame);
        }

        // إضافة وظيفة لمشاهدة الإعلان للتخطي
        document.getElementById('adButton').addEventListener('click', function () {
            if (isCooldown) {
                window.open("https://youtube.com/@crypto_bots3", "_blank");
                isCooldown = false;  // تخطي وقت الانتظار
                lives = 3;  // إعادة الأرواح
                document.getElementById('lives').textContent = lives;
                document.getElementById('cooldown-message').style.display = 'none';  // إخفاء رسالة الانتظار
            }
        });
    </script>
</body>
</html>
