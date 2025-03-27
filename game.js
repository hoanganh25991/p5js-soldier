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
let frameCount = 0;
let totalEnemiesSpawned = 0;

// Shared utility functions
function updateHeight(entity) {
    // Adjust height based on pillar height
    entity.y = -20 - pillarHeight * 5 + entity.height/2;
}

function showAimLine(source, target, gunZ = null, aimColor = [255, 255, 0]) {
    // Get gun position (slightly above source center)
    let gunX = source.x;
    let gunY = source.y - source.height/3;
    if (gunZ === null) gunZ = source.z;

    // Calculate angle to target
    let angle = atan2(target.z - gunZ, target.x - gunX);

    // Draw aim line
    push();
    stroke(...aimColor);
    strokeWeight(2);
    noFill();
    beginShape(LINES);
    vertex(gunX, gunY, gunZ);
    vertex(target.x, target.y + target.height/2, target.z);
    endShape();
    pop();

    return { gunX, gunY, gunZ, angle };
}

function autoShoot(source, targetCount = 1, fireRate = CONFIG.FIRE_RATE) {
    if (frameCount % fireRate !== 0) return;

    // Find targets
    let targets = source.findNearestEnemies(targetCount);

    // Debug: Log if we found any targets
    console.log(`${source.constructor.name} found ${targets.length} targets`);

    // Draw aim lines and shoot at all targets
    for (let target of targets) {
        let { gunX, gunY, gunZ, angle } = showAimLine(source, target);
        source.rotation = angle + HALF_PI;

        // Debug: Log target position
        console.log(`Shooting at target: ${target.x.toFixed(0)}, ${target.y.toFixed(0)}, ${target.z.toFixed(0)}`);

        // Create bullet
        bullets.push(new Bullet(gunX, gunY, gunZ, angle, target, source));
        shootSound.play();
    }
}

function findNearestEnemies(source, count = 1) {
    if (enemies.length === 0) return [];

    // Sort enemies by distance to source
    return enemies
        .map(enemy => ({
            enemy,
            distance: dist(source.x, source.z, enemy.x, enemy.z)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, count)
        .map(data => data.enemy);
}

let skillCooldowns = {
    clone: 0,
    turret: 0,
    airstrike: 0,
    laser: 0
};

let camera;
let gameFont;
let shootSound;
let cloneSound;

// Camera control variables
let cameraRotationX = -0.4; // Less steep angle for better perspective
let cameraRotationY = 0;
let zoomLevel = 2.0; // Wider view of battlefield
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let baseCameraDistance = 300; // Base distance that will be multiplied by zoomLevel

class Player {
    constructor() {
        this.x = 0;
        this.y = 0; // Will be calculated based on pillar height
        this.z = 0;
        this.width = CONFIG.PLAYER_WIDTH;
        this.height = CONFIG.PLAYER_HEIGHT;
        this.depth = CONFIG.PLAYER_DEPTH;
        this.rotation = 0;
        this.targetEnemy = null;
        this.updateHeight(); // Initialize height
    }

    show() {
        // this.autoShoot(1); // Auto-target and show aim lines for 3 nearest enemies

        push();
        translate(this.x, this.y, this.z);
        rotateY(this.rotation);

        // Player body
        fill(0, 255, 0);
        box(this.width, this.height, this.depth);

        // Gun
        push();
        translate(-this.width / 2, -this.height / 4, 0);
        fill(100);
        rotateZ(HALF_PI);
        cylinder(4, 20);
        pop();

        pop();
    }

    findNearestEnemies(count = 1) {
        return findNearestEnemies(this, count);
    }

    showAimLine(target, aimColor = [255, 255, 0]) {
        return showAimLine(this, target, null, aimColor);
    }

    autoShoot(targetCount = 1) {
        autoShoot(this, targetCount, CONFIG.FIRE_RATE);
    }

    update() {
        this.updateHeight();
        this.autoShoot();
    }

    updateHeight() {
        updateHeight(this);
        // Update clones height too
        for (let clone of clones) {
            updateHeight(clone);
        }
    }
}

class Enemy {
    constructor(x, z, attributes) {
        this.x = x;
        this.z = z;
        this.y = 0;
        
        // Random attributes with multipliers
        let sizeMultiplier = attributes.sizeMultiplier || 1;
        this.width = CONFIG.ENEMY_WIDTH * sizeMultiplier;
        this.height = CONFIG.ENEMY_HEIGHT * sizeMultiplier;
        this.depth = CONFIG.ENEMY_DEPTH * sizeMultiplier;
        
        // Health scales with size
        this.maxHealth = CONFIG.ENEMY_HEALTH * (sizeMultiplier * 1.5);
        this.health = this.maxHealth;
        
        // Bigger enemies are slower
        this.speed = CONFIG.ENEMY_SPEED / sizeMultiplier;
        
        // Damage scales with size
        this.damageMultiplier = sizeMultiplier;
        
        this.rotation = 0;
        
        // Store color attributes
        this.baseColor = attributes.baseColor || color(255, 0, 0);
        this.damageColor = attributes.damageColor || color(255, 165, 0);
        this.colorBlend = attributes.colorBlend || 0; // 0 = base color, 1 = damage color
    }

    static spawnRandom() {
        let angle = random(TWO_PI);
        let radius = CONFIG.ENEMY_RADIUS;
        let x = cos(angle) * radius;
        let z = sin(angle) * radius;
        
        // Random attributes
        let sizeMultiplier = random(0.7, 1.5); // Size variation
        let colorBlend = random(); // How much damage color to show
        
        // Different enemy types
        let attributes = {
            sizeMultiplier: sizeMultiplier,
            baseColor: color(255, 0, 0), // Base red
            damageColor: color(255, 165, 0), // Orange for damage
            colorBlend: colorBlend
        };
        
        return new Enemy(x, z, attributes);
    }

    update() {
        let angle = atan2(0 - this.z, 0 - this.x);
        this.x += cos(angle) * this.speed;
        this.z += sin(angle) * this.speed;
        this.rotation = angle + HALF_PI; // Make enemy face the pillar

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
        rotateY(this.rotation);
        
        // Calculate color based on health and damage type
        let healthPercent = this.health / this.maxHealth;
        let r = lerp(this.baseColor._getRed(), this.damageColor._getRed(), this.colorBlend);
        let g = lerp(this.baseColor._getGreen(), this.damageColor._getGreen(), this.colorBlend);
        let b = lerp(this.baseColor._getBlue(), this.damageColor._getBlue(), this.colorBlend);
        
        // Darken based on health
        r *= healthPercent;
        g *= healthPercent;
        b *= healthPercent;
        
        fill(r, g, b);
        box(this.width, this.height, this.depth);
        pop();
    }
}

class Bullet {
    constructor(x, y, z, angle, target, source = null) {
        // Starting position (gun)
        this.x = x;
        this.y = y;
        this.z = z;
        this.angle = angle;
        
        // Set bullet properties based on source
        if (source instanceof Airstrike) {
            this.speed = CONFIG.AIRSTRIKE.SPEED;
            this.size = 40; // Much bigger bombs
            this.damage = source.damage;
            this.color = [200, 0, 0];
            // Velocity set by airstrike update
            this.vx = 0;
            this.vy = 0;
            this.vz = 0;
        } else {
            const bulletType = source instanceof Turret ? CONFIG.BULLET.TURRET : CONFIG.BULLET.PLAYER;
            this.speed = source instanceof Turret ? CONFIG.TURRET.BULLET_SPEED : bulletType.SPEED;
            this.size = bulletType.SIZE;
            this.damage = source ? source.damage : bulletType.DAMAGE;
            this.color = bulletType.COLOR;
            
            if (target) {
                // Calculate direction vector to target
                let targetY = target.y + target.height / 2; // Aim at enemy top half
                let dx = target.x - x;
                let dy = targetY - y;
                let dz = target.z - z;
                let dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

                // Normalize direction vector and multiply by speed
                this.vx = (dx / dist) * this.speed;
                this.vy = (dy / dist) * this.speed;
                this.vz = (dz / dist) * this.speed;
            }
        }
    }

    update() {
        // Move bullet along direction vector
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        // Debug: Log bullet position every second
        if (frameCount % 60 === 0) {
            console.log(`Bullet at: ${this.x.toFixed(0)}, ${this.y.toFixed(0)}, ${this.z.toFixed(0)}`);
            console.log(`Bullet velocity: ${this.vx.toFixed(2)}, ${this.vy.toFixed(2)}, ${this.vz.toFixed(2)}`);
        }

        // Check collision with enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            let enemy = enemies[i];
            let d = dist(this.x, this.z, enemy.x, enemy.z);
            
            // Check if bullet is at right height to hit enemy
            if (d < enemy.width * 1.5 && 
                this.y < enemy.y + enemy.height && 
                this.y > enemy.y) {
                console.log('Bullet hit enemy!');
                enemy.health -= this.damage;
                if (enemy.health <= 0) {
                    enemies.splice(i, 1);
                    enemiesKilled++;
                }
                return true; // Bullet hit something
            }
        }

        // Check if bullet is too far or hit ground
        let distance = dist(0, 0, this.x, this.z);
        if (distance > CONFIG.WORLD_RADIUS || this.y > 50) {
            console.log(`Bullet removed at distance: ${distance.toFixed(0)}, height: ${this.y.toFixed(0)}`);
            return true; // Bullet out of range or hit ground
        }

        return false; // Bullet still active
    }

    show() {
        push();
        noStroke();
        translate(this.x, this.y, this.z);
        fill(...this.color);
        rotateX(HALF_PI);
        cylinder(this.size/3, this.size);
        pop();
    }
}

class Clone {
    constructor(x, y, z) {
        // Position
        this.x = x;
        this.y = y;
        this.z = z;
        
        // Scale everything down to 70%
        const scale = 0.7;
        this.width = CONFIG.PLAYER_WIDTH * scale;
        this.height = CONFIG.PLAYER_HEIGHT * scale;
        this.depth = CONFIG.PLAYER_DEPTH * scale;
        
        // Combat stats
        this.health = CONFIG.PLAYER_HEALTH * scale;
        this.damage = CONFIG.BULLET_DAMAGE * scale;
        
        // Clone specific
        this.lifespan = CONFIG.CLONE.DURATION;
        this.rotation = 0;
        this.opacity = 180; // Slightly transparent
    }

    findNearestEnemies(count = 1) {
        return findNearestEnemies(this, count);
    }

    showAimLine(target, aimColor = [0, 255, 0]) {
        // Get gun position (slightly above clone center)
        let gunX = this.x;
        let gunZ = this.z;
        let gunY = this.y - this.height / 3; // Gun position above center

        // Calculate angle to target
        let angle = atan2(target.z - gunZ, target.x - gunX);

        // Draw aim line from gun to enemy
        stroke(...aimColor);
        strokeWeight(2);
        beginShape();
        vertex(gunX, gunY, gunZ); // Start at gun
        vertex(target.x, target.y + target.height / 2, target.z); // End at enemy top
        endShape();

        // Draw target marker
        push();
        translate(target.x, target.y + target.height / 2, target.z);
        stroke(255, 0, 0);
        strokeWeight(4);
        point(0, 0, 0); // Target point
        pop();

        return { gunX, gunY, gunZ, angle };
    }

    autoShoot(targetCount = 1) {
        if (frameCount % CONFIG.CLONE.FIRE_RATE !== 0) return;

        // Find multiple targets
        let targets = this.findNearestEnemies(targetCount);
        if (!Array.isArray(targets)) targets = targets ? [targets] : [];

        // Draw aim lines for all targets
        push();
        for (let target of targets) {
            let { gunX, gunY, gunZ, angle } = this.showAimLine(target, [0, 255, 0]);

            // Update rotation to face target
            this.rotation = angle + HALF_PI;

            // Spawn bullet with target info and clone as source
            bullets.push(new Bullet(gunX, gunY, gunZ, angle, target, this));
            break; // Only shoot at first target
        }
        pop();
    }

    update() {
        this.lifespan--;
    }

    show() {
        this.autoShoot(3); // Auto-target and show aim lines for 3 nearest enemies

        push();
        translate(this.x, this.y, this.z);
        rotateY(this.rotation);

        // Clone body - lighter green and slightly transparent
        fill(100, 255, 100, map(this.lifespan, 0, CONFIG.CLONE.DURATION, 0, this.opacity));
        box(this.width, this.height, this.depth);

        // Gun
        push();
        translate(-this.width / 2, -this.height / 4, 0);
        fill(150, 150, 150, map(this.lifespan, 0, CONFIG.CLONE.DURATION, 0, this.opacity));
        rotateZ(HALF_PI);
        cylinder(3, 15); // Slightly smaller gun
        pop();

        pop();
    }
}

class Turret {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.width = 25;
        this.height = 35;
        this.depth = 25;
        this.lifespan = CONFIG.TURRET.DURATION;
        this.rotation = 0;
        this.damage = CONFIG.TURRET.DAMAGE;
        this.updateHeight(); // Initialize height
        this.legLength = 20;
    }

    findNearestEnemies(count = 1) {
        return findNearestEnemies(this, count);
    }

    showAimLine(target, gunZ) {
        return showAimLine(this, target, gunZ, [255, 0, 0]);
    }

    autoShoot(targetCount = CONFIG.TURRET.MAX_TARGETS) {
        autoShoot(this, targetCount, CONFIG.TURRET.FIRE_RATE);
    }

    update() {
        this.lifespan--;
        this.updateHeight();
        this.autoShoot();
    }

    updateHeight() {
        updateHeight(this);
    }

    show() {
        push();
        translate(this.x, this.y, this.z);
        rotateY(this.rotation);

        // Draw legs
        push();
        fill(80);
        strokeWeight(2);
        stroke(60);
        
        // Front legs
        push();
        translate(this.width/3, 0, this.depth/3);
        box(3, this.legLength, 3);
        pop();
        
        push();
        translate(-this.width/3, 0, this.depth/3);
        box(3, this.legLength, 3);
        pop();

        // Back legs
        push();
        translate(this.width/3, 0, -this.depth/3);
        box(3, this.legLength, 3);
        pop();
        
        push();
        translate(-this.width/3, 0, -this.depth/3);
        box(3, this.legLength, 3);
        pop();
        pop();

        // Base - slightly above ground due to legs
        translate(0, -this.legLength/2, 0);
        fill(100, 100, 255, map(this.lifespan, 0, CONFIG.TURRET.DURATION, 0, 255));
        box(this.width, this.height/2, this.depth);

        // Upper part (gun mount)
        push();
        translate(0, -this.height/3, 0);
        fill(80);
        box(this.width/1.5, this.height/3, this.depth/1.5);
        pop();

        // Double gun barrels
        push();
        translate(this.width/2, -this.height/3, 0);
        fill(40);
        rotateZ(HALF_PI);
        
        // Top barrel
        push();
        translate(0, 0, 3);
        cylinder(2, 20);
        pop();
        
        // Bottom barrel
        push();
        translate(0, 0, -3);
        cylinder(2, 20);
        pop();
        
        pop();

        pop();
    }
}

class Airstrike {
    constructor() {
        this.x = -CONFIG.ENEMY_RADIUS;
        this.y = -650; // Even higher above pillars
        this.z = 0;
        this.speed = CONFIG.AIRSTRIKE.SPEED;
        this.damage = CONFIG.AIRSTRIKE.DAMAGE;
    }

    update() {
        this.x += this.speed;

        // Drop bombs periodically
        if (frameCount % CONFIG.AIRSTRIKE.BOMB_RATE === 0) {
            // Create bullet with no target, just straight down
            let bullet = new Bullet(this.x, this.y, this.z, 0, null, this);
            bullet.vy = 3; // Move downward faster
            bullet.vx = this.speed * 0.5; // Keep some forward momentum
            bullets.push(bullet);
        }

        // Remove when past the world
        if (this.x > CONFIG.WORLD_RADIUS) {
            let index = airstrikes.indexOf(this);
            if (index > -1) airstrikes.splice(index, 1);
        }
    }

    show() {
        push();
        translate(this.x, this.y, this.z);
        fill(150);
        
        // Rotate for horizontal flight
        rotateZ(HALF_PI);
        
        // Main body (fuselage)
        push();
        rotateX(HALF_PI);
        cylinder(15, 80);
        pop();
        
        // Wings
        push();
        translate(0, 30, 0);
        box(60, 5, 20);
        pop();
        
        push();
        translate(0, -30, 0);
        box(60, 5, 20);
        pop();
        
        // Tail vertical
        push();
        translate(0, -35, 0);
        box(20, 30, 5);
        pop();
        
        // Tail horizontal
        push();
        translate(0, -35, 15);
        box(30, 5, 5);
        pop();
        
        pop();
    }
}

class Laser {
    constructor() {
        this.y = height / 2;
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

function spawnEnemies() {
    if (enemies.length < CONFIG.MAX_ENEMIES && frameCount % CONFIG.SPAWN_INTERVAL === 0) {
        enemies.push(Enemy.spawnRandom());
        totalEnemiesSpawned++;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function mouseWheel(event) {
    // Zoom with mouse wheel - rolling forward (negative delta) decreases zoom level (zooms in)
    // rolling backward (positive delta) increases zoom level (zooms out)
    zoomLevel = constrain(zoomLevel + (event.delta * 0.001), 0.2, 10.0);
    return false; // Prevent default scrolling
}

function mousePressed() {
    // Start dragging with middle mouse button (button 1)
    if (mouseButton === CENTER) {
        isDragging = true;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

function mouseReleased() {
    if (mouseButton === CENTER) {
        isDragging = false;
    }
}

function updateCamera() {
    // Update camera rotation when dragging
    if (isDragging) {
        let deltaX = (mouseX - lastMouseX) * 0.01;
        let deltaY = (mouseY - lastMouseY) * 0.01;

        cameraRotationY += deltaX;
        cameraRotationX = constrain(cameraRotationX + deltaY, -PI / 2, 0);

        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }

    // Position camera behind player at 1/3 screen height
    let currentDistance = baseCameraDistance * zoomLevel;

    // Calculate camera position
    let camX = sin(cameraRotationY) * currentDistance;
    let camZ = cos(cameraRotationY) * currentDistance;

    // Position camera behind player
    camera.setPosition(
        camX, // Keep player centered horizontally
        player.y - 600, // Camera slightly above player
        camZ + 100 // Camera behind player
    );

    // Look at point in front of player at 1/3 screen height
    camera.lookAt(
        0, // Keep centered horizontally
        player.y + 700, // Look slightly down
        -400 // Look ahead of player
    );
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    camera = createCamera();
    gameFont = loadFont('opensans-light.ttf');
    shootSound = loadSound('single-shot.mp3');
    cloneSound = loadSound('woosh-effect-12-255591.mp3');
    player = new Player();

    // Initial enemy spawn
    for (let i = 0; i < CONFIG.ENEMY_COUNT; i++) {
        enemies.push(Enemy.spawnRandom());
        totalEnemiesSpawned++;
    }
}



function draw() {
    frameCount++;

    // Sky gradient
    background(135, 206, 235); // Light blue sky

    // Update player first to get new height
    player.update();

    // Update camera position and rotation
    updateCamera();

    // Add some ambient light
    ambientLight(100);
    pointLight(255, 255, 255, 0, -500, 0);

    // Draw ground
    push();
    translate(0, 50, 0);
    rotateX(HALF_PI);
    fill(34, 139, 34); // Forest green
    noStroke();
    plane(CONFIG.WORLD_RADIUS * 2, CONFIG.WORLD_RADIUS * 2);

    // Add grid pattern
    stroke(45, 150, 45);
    strokeWeight(1);
    let gridSize = 100;
    for (let x = -CONFIG.WORLD_RADIUS; x <= CONFIG.WORLD_RADIUS; x += gridSize) {
        line(x, -CONFIG.WORLD_RADIUS, x, CONFIG.WORLD_RADIUS);
    }
    for (let z = -CONFIG.WORLD_RADIUS; z <= CONFIG.WORLD_RADIUS; z += gridSize) {
        line(-CONFIG.WORLD_RADIUS, z, CONFIG.WORLD_RADIUS, z);
    }
    pop();

    // Draw pillar
    push();
    translate(0, 25 - pillarHeight * 2.5, 0);
    fill(150);
    box(80, pillarHeight * 5, 80); // Wider pillar
    // Add visual markers on pillar
    for (let i = 0; i < 5; i++) {
        push();
        translate(0, pillarHeight * 2.5 - i * pillarHeight, 0);
        fill(100);
        box(82, 2, 82); // Match pillar width
        pop();
    }
    pop();

    // Spawn new enemies
    spawnEnemies();

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
        if (bullets[i].update()) { // Returns true if bullet should be removed
            bullets.splice(i, 1);
        } else {
            bullets[i].show();
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
        push();
        translate(-100, 0, 0); // Center the text in 3D space
        textFont(gameFont);
        textSize(32);
        fill(255, 0, 0);
        textAlign(CENTER);
        text('Game Over!', 0, 0);
        pop();
    } else if (enemiesKilled >= 1000) {
        noLoop();
        push();
        translate(-100, 0, 0); // Center the text in 3D space
        textFont(gameFont);
        textSize(32);
        fill(0, 255, 0);
        textAlign(CENTER);
        text('Victory!', 0, 0);
        pop();
    }
}

// Auto-shooting is handled in player.autoShoot()

// Global popup timer
let popupTimer = null;

function showCooldownMessage(skillName, cooldown) {
    const popup = document.getElementById('cooldown-popup');
    popup.textContent = `${skillName} on cooldown: ${Math.ceil(cooldown/60)}s`;
    popup.style.opacity = '1';
    
    // Clear existing timer
    if (popupTimer) clearTimeout(popupTimer);
    
    // Hide popup after 2 seconds
    popupTimer = setTimeout(() => {
        popup.style.opacity = '0';
    }, 2000);
}

function keyPressed() {
    if (key === 'c' || key === 'C') {
        if (skillCooldowns.clone <= 0) {
            // Create clone at random position around the player
            let angle = random(TWO_PI);
            let radius = 30;
            let cloneX = player.x + cos(angle) * radius;
            let cloneZ = player.z + sin(angle) * radius;
            clones.push(new Clone(cloneX, player.y, cloneZ));
            
            // Play woosh sound
            cloneSound.play();
            
            // Optional: Limit max number of clones to avoid overwhelming
            if (clones.length > CONFIG.CLONE.MAX_CLONES) {
                clones.shift(); // Remove oldest clone if too many
            }
            skillCooldowns.clone = CONFIG.CLONE.COOLDOWN;
        } else {
            showCooldownMessage('Clone', skillCooldowns.clone);
        }
    } else if (key === 't' || key === 'T') {
        if (skillCooldowns.turret <= 0) {
            // Create turret at random position around the player
            let angle = random(TWO_PI);
            let radius = 40;
            let turretX = player.x + cos(angle) * radius;
            let turretZ = player.z + sin(angle) * radius;
            turrets.push(new Turret(turretX, player.y, turretZ));
            skillCooldowns.turret = CONFIG.TURRET.COOLDOWN;
        } else {
            showCooldownMessage('Turret', skillCooldowns.turret);
        }
    } else if (key === 'a' || key === 'A') {
        if (skillCooldowns.airstrike <= 0) {
            airstrikes.push(new Airstrike());
            skillCooldowns.airstrike = 600;
        } else {
            showCooldownMessage('Airstrike', skillCooldowns.airstrike);
        }
    } else if (key === 'l' || key === 'L') {
        if (skillCooldowns.laser <= 0) {
            lasers.push(new Laser());
            skillCooldowns.laser = 450;
        } else {
            showCooldownMessage('Laser', skillCooldowns.laser);
        }
    }
}
