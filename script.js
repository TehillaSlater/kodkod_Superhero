const gameBoard = document.getElementById("gameBoard");
const spiderman = document.getElementById("spiderman");
const swingLine = document.getElementById("swingLine");
const webAnchor = document.getElementById("webAnchor");
const obstacle = document.getElementById("obstacle");
const docOckTentacle = document.getElementById("docOckTentacle");
const greenGoblin = document.getElementById("greenGoblin");
const spiderSense = document.getElementById("spiderSense");
const scoreElement = document.getElementById("score");
const ammoCountElement = document.getElementById("ammoCount");
const finalScoreElement = document.getElementById("finalScore");
const gameOverScreen = document.getElementById("gameOverScreen");
const skyline = document.getElementById("skyline");

const BOARD_HEIGHT = 360;

// משתני משחק
let isGameOver = false;
let score = 0;
let animationFrameId;
let scoreInterval;
let runCycleInterval;
let runFrame = 1;

// פיזיקה של ספיידרמן וקור הנדנוד
let spideyBottom = 35;
let velocityY = 0;
const gravity = 0.75;
let isJumping = false;
let isDucking = false;
let swingAnchorX = 240;

// מערכת ירי קורים (Web Shooters)
let webAmmo = 5;
const maxWebAmmo = 5;
let activeWebs = [];

// נתוני מכשולים רצים רגילים
let obstacleX = 900;
let baseSpeed = 6.5;
let currentObstacleSpeed = 6.5;
let currentObstacleType = "pumpkin";
let droneWaveAngle = 0;
let obstaclesDodged = 0;
let nextSpecialBoss = "docOck"; // מתחלף בין 'docOck' לבין 'goblin'

// מערכת הזרוע של דוק אוק (Doc Ock Tentacle)
let tentacleState = "idle"; // 'idle' | 'warning' | 'striking' | 'holding' | 'retracting'
let tentacleX = 880;
let warningTimeoutId = null;
let holdTimeoutId = null;

// מערכת הפצצה אווירית של הגובלין הירוק (Green Goblin Air Raid)
let goblinState = "idle"; // 'idle' | 'flying'
let goblinX = 920;
let goblinWave = 0;
let droppedBomb1 = false;
let droppedBomb2 = false;
let goblinBombs = [];

// בדיקה אם מתקפת בוס כלשהי פעילה כרגע
function isSpecialAttackActive() {
    return tentacleState !== "idle" || goblinState !== "idle" || goblinBombs.length > 0;
}

// עדכון תצוגת התנוחה של ספיידרמן
function updateSpideyPose() {
    spiderman.classList.remove("run-1", "run-2", "jumping", "ducking");
    if (isDucking) {
        spiderman.classList.add("ducking");
        swingLine.classList.add("hidden");
        webAnchor.classList.add("hidden");
    } else if (isJumping) {
        spiderman.classList.add("jumping");
        swingLine.classList.remove("hidden");
        webAnchor.classList.remove("hidden");
    } else {
        spiderman.classList.add(runFrame === 1 ? "run-1" : "run-2");
        swingLine.classList.add("hidden");
        webAnchor.classList.add("hidden");
    }
}

// עדכון קור הנדנוד בזמן אמת מהיד של ספיידרמן לתקרה
function updateSwingWebLine() {
    if (!isJumping || isDucking) {
        swingLine.classList.add("hidden");
        webAnchor.classList.add("hidden");
        return;
    }

    const handX = 114;
    const handY = BOARD_HEIGHT - (spideyBottom + 58);
    swingAnchorX -= 1.8;

    swingLine.setAttribute("x1", handX);
    swingLine.setAttribute("y1", handY);
    swingLine.setAttribute("x2", swingAnchorX);
    swingLine.setAttribute("y2", 6);

    webAnchor.setAttribute("cx", swingAnchorX);
    webAnchor.setAttribute("cy", 6);
}

// אנימציית ריצה רציפה
function startLoops() {
    runCycleInterval = setInterval(() => {
        if (!isGameOver && !isJumping && !isDucking) {
            runFrame = runFrame === 1 ? 2 : 1;
            updateSpideyPose();
        }
    }, 115);
}

// ירי קורי עכביש קדימה
function shootWeb() {
    if (isGameOver || webAmmo <= 0) return;

    webAmmo--;
    ammoCountElement.textContent = webAmmo;

    const webEl = document.createElement("div");
    webEl.className = "web-shot";
    const startBottom = isDucking ? spideyBottom + 14 : spideyBottom + 34;
    const startLeft = 122;

    webEl.style.bottom = startBottom + "px";
    webEl.style.left = startLeft + "px";
    gameBoard.appendChild(webEl);

    activeWebs.push({
        element: webEl,
        x: startLeft,
        y: startBottom
    });

    setTimeout(() => {
        if (!isGameOver && webAmmo < maxWebAmmo) {
            webAmmo++;
            ammoCountElement.textContent = webAmmo;
        }
    }, 1000);
}

// שליטה במקלדת
document.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        if (isGameOver) {
            restartGame();
              } else if (!isJumping) {
            isDucking = false;
            isJumping = true;
            velocityY = 13.8;
            swingAnchorX = 235;
            updateSpideyPose();
            updateSwingWebLine();
        }

    } else if (event.code === "ArrowDown") {
        event.preventDefault();
        if (!isGameOver) {
            if (isJumping) {
                velocityY = -14; // נחיתה מהירה שמאפשרת לנחות בין שתי הפצצות של הגובלין!
            }
            isDucking = true;
            updateSpideyPose();
        }
    } else if (event.code === "KeyX" || event.code === "Enter") {
        event.preventDefault();
        shootWeb();
    } else if (event.code === "KeyD") {
        // מקש בדיקה להזנקת הזרוע של דוק אוק
        event.preventDefault();
        if (!isGameOver && !isSpecialAttackActive()) {
            obstacleX = 1200;
            obstacle.style.left = obstacleX + "px";
            triggerDocOckAttack();
        }
    } else if (event.code === "KeyG") {
        // מקש בדיקה להזנקת הגובלין הירוק!
        event.preventDefault();
        if (!isGameOver && !isSpecialAttackActive()) {
            obstacleX = 1200;
            obstacle.style.left = obstacleX + "px";
            triggerGoblinAttack();
        }
    }
});

document.addEventListener("keyup", (event) => {
    if (event.code === "ArrowDown") {
        isDucking = false;
        updateSpideyPose();
    }
});

// הגרלת מכשול חדש או הפעלת מתקפת בוס (דוק אוק / הגובלין הירוק)
function spawnObstacle() {
    obstaclesDodged++;

    // כל 3 מכשולים מופעלת מתקפה מיוחדת - פעם דוק אוק ופעם הגובלין הירוק!
    if (obstaclesDodged % 3 === 0 && !isSpecialAttackActive()) {
        obstacleX = 1200;
        obstacle.style.left = obstacleX + "px";

        if (nextSpecialBoss === "docOck") {
            nextSpecialBoss = "goblin";
            triggerDocOckAttack();
        } else {
            nextSpecialBoss = "docOck";
            triggerGoblinAttack();
        }
        return;
    }

    obstacleX = 900;
    currentObstacleType = Math.random() < 0.5 ? "pumpkin" : "drone";

    if (currentObstacleType === "pumpkin") {
        obstacle.className = "pumpkin";
        obstacle.style.bottom = "35px";
    } else {
        obstacle.className = "drone";
        obstacle.style.bottom = "74px";
        droneWaveAngle = 0;
    }

    const randomVariation = (Math.random() * 3.2) - 0.4;
    currentObstacleSpeed = baseSpeed + randomVariation;
}

// מתקפה מיוחדת 1: הזרוע של דוק אוק
function triggerDocOckAttack() {
     return;
    if (isSpecialAttackActive()) return;
    tentacleState = "warning";
    tentacleX = 1500;
    docOckTentacle.style.left = tentacleX + "px";

    spiderSense.textContent = "⚡ SPIDER-SENSE! DOC OCK ATTACKING - DUCK (⬇️)! ⚡";
    spiderSense.classList.remove("hidden", "goblin-alert");
    spiderman.classList.add("tingling");
    gameBoard.classList.add("danger-border");

    warningTimeoutId = setTimeout(() => {
        if (isGameOver) return;
        tentacleState = "striking";
    }, 1800);
}

// מתקפה מיוחדת 2: הגובלין הירוק עובר מלמעלה וזורק 2 פצצות ברצף!
function triggerGoblinAttack() {
    return;
    if (isSpecialAttackActive()) return;
    goblinState = "flying";
    goblinX = 1500;
    goblinWave = 0;
    droppedBomb1 = false;
    droppedBomb2 = false;
    greenGoblin.style.left = goblinX + "px";

    spiderSense.textContent = "🎃 GREEN GOBLIN AIR RAID! DOUBLE BOMB INCOMING - JUMP (⬆️)! 🎃";
    spiderSense.classList.add("goblin-alert");
    spiderSense.classList.remove("hidden");
    spiderman.classList.add("tingling");
    gameBoard.classList.add("goblin-border");
}

// יצירת פצצת דלעת שנופלת מהגליידר של הגובלין
function dropGoblinBomb(spawnX, spawnBottom) {
    const bombEl = document.createElement("div");
    bombEl.className = "goblin-bomb";
    bombEl.style.left = spawnX + "px";
    bombEl.style.bottom = spawnBottom + "px";
    gameBoard.appendChild(bombEl);

    goblinBombs.push({
        element: bombEl,
        x: spawnX,
        bottom: spawnBottom,
        vy: -2.5, // מהירות נפילה התחלתית למטה
        vx: baseSpeed + 1.2 // ממשיכה לנוע שמאלה לעבר ספיידרמן
    });
}

// בדיקת חפיפה בין שני אלמנטים
function isColliding(rect1, rect2, pad = 6) {
    return (
        rect1.right - pad > rect2.left + pad &&
        rect1.left + pad < rect2.right - pad &&
        rect1.bottom - pad > rect2.top + pad &&
        rect1.top + pad < rect2.bottom - pad
    );
}

// לולאת המשחק המרכזית
function updateGame() {
    if (isGameOver) return;

    // 1. עדכון קפיצה, גרביטציה וקור הנדנוד לתקרה
    if (isJumping) {
        spideyBottom += velocityY;
        velocityY -= gravity;

        if (spideyBottom <= 35) {
            spideyBottom = 35;
            isJumping = false;
            velocityY = 0;
        }
        spiderman.style.bottom = spideyBottom + "px";
        updateSpideyPose();
        updateSwingWebLine();
    }

    // 2. הזזת המכשול הרץ הרגיל (רק כשאין מתקפת בוס פעילה)
    if (!isSpecialAttackActive()) {
        obstacleX -= currentObstacleSpeed;
        obstacle.style.left = obstacleX + "px";

        if (currentObstacleType === "drone") {
            droneWaveAngle += 0.12;
            const hoverOffset = Math.sin(droneWaveAngle) * 10;
            obstacle.style.bottom = (74 + hoverOffset) + "px";
        }

        if (obstacleX < -70) {
            spawnObstacle();
        }
    }

    // 3. תנועת הזרוע המכנית של דוק אוק
    if (tentacleState === "striking") {
        tentacleX -= 34;
        if (tentacleX <= 40) {
            tentacleX = 40;
            tentacleState = "holding";
            holdTimeoutId = setTimeout(() => {
                if (!isGameOver) tentacleState = "retracting";
            }, 350);
        }
        docOckTentacle.style.left = tentacleX + "px";
    } else if (tentacleState === "retracting") {
        tentacleX += 22;
        if (tentacleX >= 880) {
            tentacleX = 880;
            tentacleState = "idle";
            spiderSense.classList.add("hidden");
            spiderman.classList.remove("tingling");
            gameBoard.classList.remove("danger-border");
            spawnObstacle();
        }
        docOckTentacle.style.left = tentacleX + "px";
    }

    // 4. תנועת הגובלין הירוק בשמיים והטלת 2 פצצות ברצף
    if (goblinState === "flying") {
        goblinX -= 7.5;
        goblinWave += 0.14;
        const currentGoblinBottom = 225 + Math.sin(goblinWave) * 12;

        greenGoblin.style.left = goblinX + "px";
        greenGoblin.style.bottom = currentGoblinBottom + "px";

        // הטלת פצצה ראשונה בחלק הימני של המסך
        if (!droppedBomb1 && goblinX <= 730) {
            droppedBomb1 = true;
            dropGoblinBomb(goblinX + 10, currentGoblinBottom);
        }

        // הטלת פצצה שנייה במרחק שמאפשר לנחות ולקפוץ שוב!
        if (!droppedBomb2 && goblinX <= 470) {
            droppedBomb2 = true;
            dropGoblinBomb(goblinX + 10, currentGoblinBottom);
        }

        if (goblinX < -100) {
            goblinState = "idle";
        }
    }

    // עדכון פיזיקה של פצצות הגובלין הנופלות מהאוויר
    for (let i = goblinBombs.length - 1; i >= 0; i--) {
        const b = goblinBombs[i];
        b.x -= b.vx;
        b.bottom += b.vy;
        b.vy -= 0.55; // כוח משיכה שמושך את הפצצה לקרקע

        // כשהפצצה פוגעת בגג הבניין - היא מקפצת קלות וממשיכה להתגלגל מהר שמאלה
        if (b.bottom <= 35) {
            b.bottom = 35;
            b.vy = Math.abs(b.vy) * 0.42;
            if (b.vy < 1.8) b.vy = 0;
        }

        b.element.style.left = b.x + "px";
        b.element.style.bottom = b.bottom + "px";

        if (b.x < -50) {
            b.element.remove();
            goblinBombs.splice(i, 1);

            // אם שתי הפצצות יצאו והגובלין סיים לעבור - חוזרים לשגרה
            if (goblinBombs.length === 0 && goblinState === "idle") {
                spiderSense.classList.add("hidden");
                spiderSense.classList.remove("goblin-alert");
                spiderman.classList.remove("tingling");
                gameBoard.classList.remove("goblin-border");
                spawnObstacle();
            }
        }
    }

    // 5. עדכון קליעי קורי עכביש ופגיעה ברחפנים של מיסטריו
    const obstacleRect = obstacle.getBoundingClientRect();
    for (let i = activeWebs.length - 1; i >= 0; i--) {
        const web = activeWebs[i];
        web.x += 16;
        web.element.style.left = web.x + "px";

        const webRect = web.element.getBoundingClientRect();

        if (!isSpecialAttackActive() && isColliding(webRect, obstacleRect, 2)) {
            web.element.remove();
            activeWebs.splice(i, 1);

            if (currentObstacleType === "drone") {
                score += 25;
                scoreElement.textContent = score;
                spawnObstacle();
            }
            continue;
        }

        if (web.x > 880) {
            web.element.remove();
            activeWebs.splice(i, 1);
        }
    }

    // 6. בדיקת התנגשות של ספיידרמן עם מכשולים, דוק אוק, או פצצות הגובלין
    const spideyRect = spiderman.getBoundingClientRect();
    const tentacleRect = docOckTentacle.getBoundingClientRect();

    const hitObstacle = !isSpecialAttackActive() && isColliding(spideyRect, obstacleRect, 7);
    const hitTentacle = (tentacleState === "striking" || tentacleState === "holding" || tentacleState === "retracting") &&
        isColliding(spideyRect, tentacleRect, 6);

    let hitGoblinBomb = false;
    for (const b of goblinBombs) {
        if (isColliding(spideyRect, b.element.getBoundingClientRect(), 6)) {
            hitGoblinBomb = true;
            break;
        }
    }

    if (hitObstacle || hitTentacle || hitGoblinBomb) {
        triggerGameOver();
        return;
    }

    animationFrameId = requestAnimationFrame(updateGame);
}

// ניקוד, מהירות ומעבר יום/לילה
function startScoring() {
    scoreInterval = setInterval(() => {
        score++;
        scoreElement.textContent = score;

        if (score % 100 === 0 && baseSpeed < 15) {
            baseSpeed += 0.6;
        }

        if (score > 0 && score % 250 === 0) {
            gameBoard.classList.toggle("night");
            gameBoard.classList.toggle("day");
        }
    }, 80);
}

function triggerGameOver() {
    isGameOver = true;
    clearInterval(scoreInterval);
    clearInterval(runCycleInterval);
    clearTimeout(warningTimeoutId);
    clearTimeout(holdTimeoutId);
    cancelAnimationFrame(animationFrameId);

    skyline.style.animationPlayState = "paused";
    obstacle.style.animationPlayState = "paused";
    spiderSense.classList.add("hidden");
    spiderman.classList.remove("tingling");
    gameBoard.classList.remove("danger-border", "goblin-border");

    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove("hidden");
}

function restartGame() {
    isGameOver = false;
    score = 0;
    baseSpeed = 6.5;
    spideyBottom = 35;
    isJumping = false;
    isDucking = false;
    webAmmo = maxWebAmmo;
    obstaclesDodged = 0;
    nextSpecialBoss = "docOck";

    clearTimeout(warningTimeoutId);
    clearTimeout(holdTimeoutId);

    activeWebs.forEach(w => w.element.remove());
    activeWebs = [];

    goblinBombs.forEach(b => b.element.remove());
    goblinBombs = [];
    goblinState = "idle";
    goblinX = 920;
    greenGoblin.style.left = "920px";

    tentacleState = "idle";
    tentacleX = 880;
    docOckTentacle.style.left = "880px";
    spiderSense.classList.add("hidden");
    spiderSense.classList.remove("goblin-alert");
    spiderman.classList.remove("tingling");
    gameBoard.classList.remove("danger-border", "goblin-border");

    scoreElement.textContent = "0";
    ammoCountElement.textContent = webAmmo;
    spiderman.style.bottom = "35px";
    updateSpideyPose();

    gameBoard.classList.add("night");
    gameBoard.classList.remove("day");

    skyline.style.animationPlayState = "running";
    obstacle.style.animationPlayState = "running";
    gameOverScreen.classList.add("hidden");

    spawnObstacle();
    startScoring();
    startLoops();
    updateGame();
}

// הפעלת המשחק
spawnObstacle();
startScoring();
startLoops();
updateGame();