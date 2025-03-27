let player;
let enemies = [];
let bullets = [];
let clones = [];
let turrets = [];
let airstrikes = [];
let lasers = [];
let pillarHeight = CONFIG.PILLAR_HEIGHT;
let playerHealth = CONFIG.PLAYER_HEALTH;
let enemiesKilled = 0;
let lastAutoFire = 0;

let skillCooldowns = {
    clone: 0,
    turret: 0,
    airstrike: 0,
    laser: 0
};

let camera;

class Player {
    constructor() {
        this.x = 0;
        this.y = -pillarHeight * 5; // Will be updated as pillar changes
        this.z = 0;
        this.size = CONFIG.PLAYER_SIZE;
        this.rotation = 0;
        this.targetEnemy = null;
    }

    show() {
        this.showAimLine();
        
        push();
        translate(this.x, this.y, this.z);
        rotateY(this.rotation);
        
        // Player body
        fill(0, 255, 0);
        box(this.size);
        
        // Gun
        push();
        translate(this.size/2, 0, 0);
        fill(100);
        rotateZ(HALF_PI);
        cylinder(2, 20);
        pop();
        
        pop();
    }

    autoShoot() {
        // Find nearest enemy
        let nearestEnemy = null;
        let minDist = Infinity;
        
        for (let enemy of enemies) {
            let d = dist(this.x, this.z, enemy.x, enemy.z);
            if (d < minDist) {
                minDist = d;
                nearestEnemy = enemy;
            }
        }
        
        this.targetEnemy = nearestEnemy;
        
        if (nearestEnemy && millis() - lastAutoFire > CONFIG.AUTO_FIRE_RATE) {
            let angle = atan2(nearestEnemy.z - this.z, nearestEnemy.x - this.x);
            this.rotation = angle + HALF_PI;
            bullets.push(new Bullet(this.x, this.y, this.z, angle));
            lastAutoFire = millis();
        }
    }
    
    update() {
        // Update height based on pillar
        this.y = -pillarHeight * 5;
    }
    
    showAimLine() {
        if (this.targetEnemy) {
            push();
            stroke(255, 255, 0, 100);
            strokeWeight(2);
            line(this.x, this.y + 10, this.z, 
                 this.targetEnemy.x, this.y + 10, this.targetEnemy.z);
            pop();
        }
    }
}

class Enemy {
    constructor() {
        this.reset();
        this.health = CONFIG.ENEMY_HEALTH;
    }

    reset() {
        let angle = random(TWO_PI);
        let radius = 500;
        this.x = cos(angle) * radius;
        this.z = sin(angle) * radius;
        this.y = 0;
        this.speed = CONFIG.ENEMY_SPEED;
    }

    update() {
        let angle = atan2(0 - this.z, 0 - this.x);
        this.x += cos(angle) * this.speed;
        this.z += sin(angle) * this.speed;

        if (dist(this.x, this.z, 0, 0) < 50) {
            pillarHeight = max(0, pillarHeight - CONFIG.ENEMY_DAMAGE_TO_PILLAR);
            if (pillarHeight === 0) {
                playerHealth -= CONFIG.ENEMY_DAMAGE_TO_PLAYER;
            }
        }
    }

    show() {
        push();
        translate(this.x, this.y, this.z);
        fill(255, 0, 0);
        sphere(CONFIG.ENEMY_SIZE);
        pop();
    }
}

class Bullet {
    constructor(x, y, z, angle) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.angle = angle;
        this.speed = CONFIG.BULLET_SPEED;
    }

    update() {
        this.x += cos(this.angle) * this.speed;
        this.z += sin(this.angle) * this.speed;
    }

    show() {
        push();
        translate(this.x, this.y, this.z);
        fill(255, 255, 0);
        sphere(5);
        pop();
    }
}

class Clone {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.lifespan = CONFIG.CLONE.DURATION;
        this.lastShot = 0;
        this.rotation = 0;
        this.targetEnemy = null;
    }

    update() {
        this.lifespan--;
        
        // Find and shoot at nearest enemy
        if (millis() - this.lastShot > CONFIG.CLONE.FIRE_RATE) {
            let nearestEnemy = null;
            let minDist = Infinity;
            
            for (let enemy of enemies) {
                let d = dist(this.x, this.z, enemy.x, enemy.z);
                if (d < minDist) {
                    minDist = d;
                    nearestEnemy = enemy;
                }
            }
            
            if (nearestEnemy) {
                this.targetEnemy = nearestEnemy;
                let angle = atan2(nearestEnemy.z - this.z, nearestEnemy.x - this.x);
                this.rotation = angle + HALF_PI;
                bullets.push(new Bullet(this.x, this.y, this.z, angle));
                this.lastShot = millis();
            }
        }
    }

    showAimLine() {
        if (this.targetEnemy) {
            push();
            stroke(0, 255, 0, 50);
            strokeWeight(1);
            line(this.x, this.y + 10, this.z, 
                 this.targetEnemy.x, this.y + 10, this.targetEnemy.z);
            pop();
        }
    }

    show() {
        this.showAimLine();
        
        push();
        translate(this.x, this.y, this.z);
        rotateY(this.rotation);
        
        // Clone body
        fill(0, 200, 0, map(this.lifespan, 0, CONFIG.CLONE.DURATION, 0, 255));
        box(CONFIG.PLAYER_SIZE * 0.8);
        
        // Gun
        push();
        translate(CONFIG.PLAYER_SIZE/2, 0, 0);
        fill(100, map(this.lifespan, 0, CONFIG.CLONE.DURATION, 0, 255));
        rotateZ(HALF_PI);
        cylinder(1.5, 15);
        pop();
        
        pop();
    }
}

class Turret {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lifespan = 300;
    }

    update() {
        this.lifespan--;
        if (frameCount % 15 === 0) {
            let closestEnemy = null;
            let minDist = Infinity;
            for (let enemy of enemies) {
                let d = dist(this.x, this.y, enemy.x, enemy.y);
                if (d < minDist) {
                    minDist = d;
                    closestEnemy = enemy;
                }
            }
            if (closestEnemy) {
                let angle = atan2(closestEnemy.y - this.y, closestEnemy.x - this.x);
                bullets.push(new Bullet(this.x, this.y, angle));
            }
        }
    }

    show() {
        fill(100, 100, 255, this.lifespan);
        rect(this.x - 10, this.y - 10, 20, 20);
    }
}

class Airstrike {
    constructor() {
        this.x = -50;
        this.y = 100;
        this.speed = 5;
    }

    update() {
        this.x += this.speed;
        if (frameCount % 5 === 0) {
            bullets.push(new Bullet(this.x, this.y, HALF_PI));
        }
    }

    show() {
        fill(150);
        triangle(this.x, this.y, this.x - 20, this.y - 10, this.x - 20, this.y + 10);
    }
}

class Laser {
    constructor() {
        this.y = height/2;
        this.lifespan = 60;
    }

    update() {
        this.lifespan--;
        for (let enemy of enemies) {
            if (abs(enemy.y - this.y) < 20) {
                enemy.health -= 5;
            }
        }
    }

    show() {
        stroke(255, 0, 0, this.lifespan * 4);
        strokeWeight(4);
        line(0, this.y, width, this.y);
        strokeWeight(1);
        stroke(0);
    }
}

function setup() {
    createCanvas(800, 600, WEBGL);
    camera = createCamera();
    player = new Player();
    for (let i = 0; i < CONFIG.ENEMY_COUNT; i++) {
        enemies.push(new Enemy());
    }
}



function draw() {
    background(50);
    
    // Set up 3D camera from above player
    let cameraY = -pillarHeight * 5 - 150; // Higher above the player
    camera.setPosition(0, cameraY, 100);
    camera.lookAt(0, -pillarHeight * 5, 0); // Look at player position
    
    // Add some ambient light
    ambientLight(100);
    pointLight(255, 255, 255, 0, -500, 0);
    
    // Draw ground
    push();
    translate(0, 50, 0);
    rotateX(HALF_PI);
    fill(100);
    noStroke();
    plane(1000, 1000);
    pop();

    // Draw pillar
    push();
    translate(0, 25 - pillarHeight * 2.5, 0);
    fill(150);
    box(50, pillarHeight * 5, 50);
    pop();

    player.show();

    // Update and show enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();
        enemies[i].show();
        if (enemies[i].health <= 0) {
            enemies.splice(i, 1);
            enemiesKilled++;
            if (enemies.length < 50) {
                enemies.push(new Enemy());
            }
        }
    }

    // Update and show bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        bullets[i].show();
        
        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (dist(bullets[i].x, bullets[i].y, enemies[j].x, enemies[j].y) < 15) {
                enemies[j].health -= 25;
                bullets.splice(i, 1);
                break;
            }
        }
        
        // Remove bullets that are off screen
        if (bullets[i] && (bullets[i].x < 0 || bullets[i].x > width || bullets[i].y < 0 || bullets[i].y > height)) {
            bullets.splice(i, 1);
        }
    }

    // Update and show clones
    for (let i = clones.length - 1; i >= 0; i--) {
        clones[i].update();
        clones[i].show();
        if (clones[i].lifespan <= 0) {
            clones.splice(i, 1);
        }
    }

    // Update and show turrets
    for (let i = turrets.length - 1; i >= 0; i--) {
        turrets[i].update();
        turrets[i].show();
        if (turrets[i].lifespan <= 0) {
            turrets.splice(i, 1);
        }
    }

    // Update and show airstrikes
    for (let i = airstrikes.length - 1; i >= 0; i--) {
        airstrikes[i].update();
        airstrikes[i].show();
        if (airstrikes[i].x > width + 50) {
            airstrikes.splice(i, 1);
        }
    }

    // Update and show lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].update();
        lasers[i].show();
        if (lasers[i].lifespan <= 0) {
            lasers.splice(i, 1);
        }
    }

    // Update cooldowns
    for (let skill in skillCooldowns) {
        if (skillCooldowns[skill] > 0) {
            skillCooldowns[skill]--;
        }
    }

    // Update status board
    document.getElementById('pillar-height').textContent = Math.ceil(pillarHeight);
    document.getElementById('health').textContent = Math.ceil(playerHealth);
    document.getElementById('kills').textContent = enemiesKilled;

    // Check win/lose conditions
    if (playerHealth <= 0) {
        noLoop();
        textSize(32);
        fill(255, 0, 0);
        textAlign(CENTER);
        text('Game Over!', width/2, height/2);
    } else if (enemiesKilled >= 1000) {
        noLoop();
        textSize(32);
        fill(0, 255, 0);
        textAlign(CENTER);
        text('Victory!', width/2, height/2);
    }
}

// Auto-shooting is handled in player.autoShoot()

function keyPressed() {
    if (key === 'c' || key === 'C') {
        if (skillCooldowns.clone <= 0) {
            // Create clone at random position around the player
            let angle = random(TWO_PI);
            let radius = 30;
            let cloneX = player.x + cos(angle) * radius;
            let cloneZ = player.z + sin(angle) * radius;
            clones.push(new Clone(cloneX, player.y, cloneZ));
            skillCooldowns.clone = CONFIG.CLONE.COOLDOWN;
        }
    } else if (key === 't' || key === 'T') {
        if (skillCooldowns.turret <= 0) {
            turrets.push(new Turret(player.x + random(-50, 50), player.y));
            skillCooldowns.turret = 300;
        }
    } else if (key === 'a' || key === 'A') {
        if (skillCooldowns.airstrike <= 0) {
            airstrikes.push(new Airstrike());
            skillCooldowns.airstrike = 600;
        }
    } else if (key === 'l' || key === 'L') {
        if (skillCooldowns.laser <= 0) {
            lasers.push(new Laser());
            skillCooldowns.laser = 450;
        }
    }
}
