class Play extends Phaser.Scene {
    constructor() {
        super('playScene');
        this.my = {sprite: {}};

        // input variables
        this.aKey = null;
        this.dKey = null;
        this.leftKey = null;
        this.rightKey = null;
        this.spaceKey = null;

        // speed variables
        this.bulletSpeed = 800;  // Pixels per second
        this.playerSpeed = 350;  
        this.asteroidSpeed = 150;

        // timers and cooldowns
        this.bulletCooldown = 0.25;
        this.bulletCooldownCounter = 0;
        this.asteroidSpawnRate = 2.0;
        this.asteroidSpawnTimer = 0;

        // wave manager variables
        this.currentWave = 1;
        this.currentPulse = 1;
        this.pulseActive = false; // Is a pulse currently running?
        this.waveTransitioning = false; // Are we doing the hyperspace warp?
        
        this.pulseDelay = 2.0;
        this.pulseDelayCounter = 2.0; 
        this.asteroidsToSpawn = 0; // Tracks how many asteroids to drop per pulse
    }

    init() {
        this.init_game();
    }

    preload() {
        // Load assets here (images, sounds, ui, etc.)
        this.load.image('player', './assets/images/playerShip1_blue.png');
        this.load.image('enemy1', './assets/images/enemyBlack5.png');
        this.load.image('blue_laser', './assets/images/laserBlue05.png');
        this.load.image('red_laser', './assets/images/laserRed05.png');
        this.load.image('green_laser', './assets/images/laserGreen08.png');
        this.load.image('player_exhaust', './assets/images/fire11.png');
        this.load.image('enemy_exhaust', './assets/images/fire03.png');
        this.load.image('starfield', './assets/images/black.png');
        this.load.image('asteroid', './assets/images/meteorBrown_big1.png');
        this.load.image('player_health_icon', './assets/ui/playerLife1_blue.png');
        this.load.image('warp_exhaust', './assets/images/fire18.png');
        this.load.image('spark1', './assets/images/laserBlue08.png');
        this.load.image('spark2', './assets/images/laserBlue09.png');
        this.load.image('enemySpark1', './assets/images/laserRed08.png');
        this.load.image('enemySpark2', './assets/images/laserRed09.png');
        this.load.image('bossSpark1', './assets/images/laserGreen14.png');
        this.load.image('bossSpark2', './assets/images/laserGreen15.png');
        this.load.audio('sfx_laser', './assets/audio/laserSmall_001.ogg'); 
        this.load.audio('sfx_enemy_laser', './assets/audio/laserSmall_003.ogg'); 
        this.load.audio('sfx_explosion', './assets/audio/lowFrequency_explosion_001.ogg'); 
        this.load.audio('sfx_damage', './assets/audio/impactMetal_000.ogg');
        this.load.image('boss_ufo', './assets/images/ufoGreen.png');
        this.load.image('player_damage1', './assets/images/playerShip1_damage1.png');
        this.load.image('player_damage2', './assets/images/playerShip1_damage2.png');
        this.load.image('explosion1', './assets/images/explosion00.png');
        this.load.image('explosion2', './assets/images/explosion01.png');
        this.load.image('explosion3', './assets/images/explosion02.png');
        this.load.image('explosion4', './assets/images/explosion03.png');
    }

    create() {
        let my = this.my;
        
        // Create starfield background
        this.starfield = this.add.tileSprite(400, 450, 800, 900, 'starfield');


        // Add the player sprite + exhaust
        my.sprite.playerExhaust = this.add.sprite(400, 800, 'player_exhaust');
        this.my.sprite.player = this.physics.add.sprite(400, 800, 'player');
        // damage overlay
        my.sprite.playerDamage = this.add.sprite(400, 800, 'player_damage1');
        my.sprite.playerDamage.visible = false;
        my.sprite.playerDamage.setDepth(10);

        // Create keys
        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // ui: score text
        this.scoreText = this.add.text(550, 20, 'SCORE: 0', { 
            fontSize: '32px', 
            fontFamily: 'Courier',
            fill: '#FFFFFF',
            fontStyle: 'bold'
        });
        this.scoreText.setDepth(100);

        // ui: health icons
        this.healthIcons = [];
        // Loop 3 times to create 3 icons based on initial playerHealth
        for (let i = 0; i < this.playerHealth; i++) {
            let icon = this.add.sprite(40 + (i * 50), 35, 'player_health_icon');
            icon.setDepth(100);
            this.healthIcons.push(icon);
        }
        // Ensure player is flagged as active so we can track death
        this.my.sprite.player.active = true;

        // bullet group setup
        my.sprite.bulletGroup = this.add.group({
            defaultKey: 'blue_laser',
            maxSize: 15 // Limit to 15 bullets on screen at once
        });

        // Create all bullets at once, set them to inactive/invisible
        my.sprite.bulletGroup.createMultiple({
            active: false,
            visible: false,
            key: my.sprite.bulletGroup.defaultKey,
            repeat: my.sprite.bulletGroup.maxSize - 1
        });

        // hit spark animation setup
        // blue animation
        this.anims.create({
            key: 'laser_hit',
            frames: [
                { key: 'spark1' },
                { key: 'spark2' }
            ],
            frameRate: 15, // Play fast
            repeat: 0,     // Only play once
            hideOnComplete: true // Automatically turn invisible when done
        });

        // red animation (for enemy bullets)
        this.anims.create({
            key: 'laser_hit_red',
            frames: [
                { key: 'enemySpark1' },
                { key: 'enemySpark2' }
            ],
            frameRate: 15, 
            repeat: 0,     
            hideOnComplete: true 
        });

        // green animation (for boss bullets)
        this.anims.create({
            key: 'laser_hit_green',
            frames: [
                { key: 'bossSpark1' },
                { key: 'bossSpark2' }
            ],
            frameRate: 15, 
            repeat: 0,     
            hideOnComplete: true 
        });

        // hit spark group setup
        this.my.sprite.sparkGroup = this.add.group({
            defaultKey: 'spark1',
            maxSize: 15 // Same size as bullet pool
        });

        this.my.sprite.sparkGroup.createMultiple({
            active: false,
            visible: false,
            key: this.my.sprite.sparkGroup.defaultKey,
            repeat: this.my.sprite.sparkGroup.maxSize - 1
        });

        for (let spark of this.my.sprite.sparkGroup.getChildren()) {
            spark.setDepth(50); // Renders on top of enemies/asteroids
        }

        // explosion animation setup
        this.anims.create({
            key: 'explode',
            frames: [
                { key: 'explosion1' },
                { key: 'explosion2' },
                { key: 'explosion3' },
                { key: 'explosion4' }
            ],
            frameRate: 12,
            repeat: 0,
            hideOnComplete: true
        });

        // explosion group setup
        this.my.sprite.explosionGroup = this.add.group({
            defaultKey: 'explosion1',
            maxSize: 20
        });

        this.my.sprite.explosionGroup.createMultiple({
            active: false,
            visible: false,
            key: this.my.sprite.explosionGroup.defaultKey,
            repeat: this.my.sprite.explosionGroup.maxSize - 1
        });

        for (let explosion of this.my.sprite.explosionGroup.getChildren()) {
            explosion.setDepth(60);
            explosion.setScale(0.25);
        }

        // asteroid group setup
        this.my.sprite.asteroidGroup = this.add.group({
            defaultKey: "asteroid",
            maxSize: 10
        });

        // enemy fighter group setup
        this.my.sprite.enemyGroup = this.add.group({
            defaultKey: "enemy1",
            maxSize: 5 
        });
        this.my.sprite.enemyGroup.createMultiple({
            active: false,
            visible: false,
            key: this.my.sprite.enemyGroup.defaultKey,
            repeat: this.my.sprite.enemyGroup.maxSize - 1
        });
        // attach exhaust to enemy fighters
        for (let enemy of this.my.sprite.enemyGroup.getChildren()) {
            // Create an exhaust sprite and attach it directly to the enemy object
            enemy.exhaust = this.add.sprite(0, 0, 'enemy_exhaust');
            enemy.exhaust.visible = false;
        }

        // boss setup
        this.my.sprite.boss = this.add.sprite(400, -200, 'boss_ufo');
        this.my.sprite.boss.setScale(2.5);
        this.my.sprite.boss.active = false;
        this.my.sprite.boss.visible = false;
        this.my.sprite.boss.setDepth(10);

        // enemy bullet group setup
        this.my.sprite.enemyBulletGroup = this.add.group({
            defaultKey: "red_laser",
            maxSize: 15 
        });
        this.my.sprite.enemyBulletGroup.createMultiple({
            active: false,
            visible: false,
            key: this.my.sprite.enemyBulletGroup.defaultKey,
            repeat: this.my.sprite.enemyBulletGroup.maxSize - 1
        });

        // boss bullet group setup
        this.my.sprite.bossBulletGroup = this.add.group({
            defaultKey: "green_laser",
            maxSize: 150
        });
        
        this.my.sprite.bossBulletGroup.createMultiple({
            active: false,
            visible: false,
            key: this.my.sprite.bossBulletGroup.defaultKey,
            repeat: this.my.sprite.bossBulletGroup.maxSize - 1
        });

        // Create all asteroids at once, set them to inactive/invisible
        this.my.sprite.asteroidGroup.createMultiple({
            active: false,
            visible: false,
            key: this.my.sprite.asteroidGroup.defaultKey,
            repeat: this.my.sprite.asteroidGroup.maxSize - 1
        });
    }

    update(time, delta) {
        // Frame-by-frame game loop (movement, collisions, etc.)
        let my = this.my;
        let dt = delta / 1000;

        // scrolling starfield
        if (this.waveTransitioning) {
            // Warp speed
            this.starfield.tilePositionY -= 800 * dt; 
        } else {
            // Normal speed
            this.starfield.tilePositionY -= 100 * dt; 
        }

        // game over transition
        if (this.isGameOver) {
            // Check if R is pressed to go back to title
            if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('R'))) {
                this.scene.start('titleScene');
            }
            return; // stop the rest of the update loop so enemies and bullets freeze
        }

        // only allow shooting if alive
        if (my.sprite.player.active) {
            // Decrement the cooldown counter
            this.bulletCooldownCounter -= dt;
        };
        

        // Move player sprite left and right
        if (this.aKey.isDown || this.leftKey.isDown) {
            my.sprite.player.x -= this.playerSpeed * dt;
        }
        if (this.dKey.isDown || this.rightKey.isDown) {
            my.sprite.player.x += this.playerSpeed * dt;
        }
        
        // Ensure player stays within bounds
        let playerHalfWidth = my.sprite.player.displayWidth / 2;
        if (my.sprite.player.x <= playerHalfWidth) {
            my.sprite.player.x = playerHalfWidth;
        }
        if (my.sprite.player.x >= 800 - playerHalfWidth) {
            my.sprite.player.x = 800 - playerHalfWidth;
        }

        // exhaust position + damage overlay position follows player
        my.sprite.playerExhaust.x = my.sprite.player.x;
        my.sprite.playerExhaust.y = my.sprite.player.y + (my.sprite.player.displayHeight / 2) + 15;
        my.sprite.playerDamage.x = my.sprite.player.x;
        my.sprite.playerDamage.y = my.sprite.player.y;

        // Firing Logic (Allow holding down the spacebar)
        if (this.spaceKey.isDown) {
            if (this.bulletCooldownCounter < 0) {
                // Get the first inactive bullet
                let bullet = my.sprite.bulletGroup.getFirstDead();
                
                // If we found an available bullet, fire it
                if (bullet != null) {
                    bullet.active = true;
                    bullet.visible = true;
                    this.sound.play('sfx_laser', { volume: 0.25 });
                    bullet.x = my.sprite.player.x;
                    bullet.y = my.sprite.player.y - (my.sprite.player.displayHeight / 2); // Fire from the nose of the ship
                    
                    // Reset cooldown
                    this.bulletCooldownCounter = this.bulletCooldown;
                }
            }
        }

        // Update Active Bullets
        for (let bullet of my.sprite.bulletGroup.getChildren()) {
            if (bullet.active) {
                // Move bullet up
                bullet.y -= this.bulletSpeed * dt;

                // Check for bullet going offscreen
                if (bullet.y < -(bullet.displayHeight / 2)) {
                    bullet.active = false;
                    bullet.visible = false;
                }
            }
        }

        // Wave manager
        // Only run wave logic if we are NOT in a hyperspace transition and the player is alive
        if (!this.waveTransitioning && my.sprite.player.active) {
            // Check if the current pulse is "cleared"
            let activeAsteroids = this.my.sprite.asteroidGroup.countActive();
            let activeFighters = this.my.sprite.enemyGroup.countActive();
            let bossActive = (my.sprite.boss && my.sprite.boss.active) ? 1 : 0;

            // If we are in Pulse 3, the fighters are all dead, but we still have asteroids waiting to spawn
            if (this.pulseActive && this.currentPulse === 3 && activeFighters === 0 && this.asteroidsToSpawn > 0) {
                this.asteroidsToSpawn = 0; // Cancel the rest of the asteroid queue
            }

            // A pulse ends when nothing is active, and we have no more asteroids waiting to spawn
            if (this.pulseActive && activeAsteroids === 0 && activeFighters === 0 && bossActive === 0 && this.asteroidsToSpawn <= 0) {
                this.pulseActive = false;
                this.currentPulse++; // Move to next pulse
                this.pulseDelayCounter = 2.0; // 2-second breather
            }

            // If a pulse is not active, count down the breather delay, then trigger the next one
            if (!this.pulseActive) {
                this.pulseDelayCounter -= dt;

                if (this.pulseDelayCounter <= 0) {
                    this.pulseActive = true;

                    // Trigger the correct pulse behaviors
                    if (this.currentPulse === 1) {
                        // Pulse 1: Warm-up Asteroids
                        this.asteroidsToSpawn = 5 + (this.currentWave * 2); // Drops more each wave
                        this.asteroidSpawnRate = 1.0; // Faster spawns
                    }
                    else if (this.currentPulse === 2) {
                        // Pulse 2: Fighter Formation
                        this.spawnFighterFormation();
                    }
                    else if (this.currentPulse === 3) {
                        // Pulse 3: Both Combined
                        this.spawnFighterFormation();
                        this.asteroidsToSpawn = 8 + (this.currentWave * 2);
                        this.asteroidSpawnRate = 1.5; // Slower spawns to act as shields
                    }
                    else if (this.currentPulse === 4) {
                        // Pulse 4: Heavy Asteroid Shower
                        this.asteroidsToSpawn = 15 + (this.currentWave * 3);
                        this.asteroidSpawnRate = 0.4; // Spawning very quickly
                    }
                    else if (this.currentPulse === 5) {
                        // Pulse 5: BOSS BATTLE
                        this.spawnBoss();
                    }
                    else if (this.currentPulse > 5) {
                        // Wave Complete, trigger the hyperspace transition
                        this.triggerWaveClear();
                    }
                }
            }

            // Handle the actual timed dropping of asteroids if we have some in the queue
            if (this.asteroidsToSpawn > 0) {
                this.asteroidSpawnTimer -= dt;
                if (this.asteroidSpawnTimer <= 0) {
                    let asteroid = this.my.sprite.asteroidGroup.getFirstDead();
                    if (asteroid != null) {
                        asteroid.active = true;
                        asteroid.visible = true;
                        asteroid.x = Phaser.Math.Between(50, 750);
                        asteroid.y = -50;
                        asteroid.rotationSpeed = Phaser.Math.Between(-100, 100);
                        asteroid.hp = 2; // Takes 2 hits to destroy
                        asteroid.clearTint(); // Removes any red damage flash from previous uses
                        this.asteroidsToSpawn--; // Deduct from the queue
                        this.asteroidSpawnTimer = this.asteroidSpawnRate;
                    }
                }
            }
        }

        // update active asteroids
        for (let asteroid of this.my.sprite.asteroidGroup.getChildren()) {
            if (asteroid.active) {
                // Move asteroid down the screen
                asteroid.y += this.asteroidSpeed * dt; 

                // Rotate asteroid based on its unique rotation speed
                asteroid.angle += asteroid.rotationSpeed * dt;

                // Check for asteroid going off the bottom of the screen
                if (asteroid.y > 950) {
                    asteroid.active = false;
                    asteroid.visible = false;
                }
            }
        }

        // update boss
        let boss = this.my.sprite.boss;
        if (boss && boss.active) {
            
            // State: Entering the screen
            if (boss.state === 'entering') {
                boss.y += 100 * dt; // Float down slowly
                if (boss.y >= 150) {
                    boss.y = 150;
                    boss.state = 'strafing';
                }
            } 
            // State: Combat
            else if (boss.state === 'strafing') {
                
                // Movement (Ping-pong left and right)
                boss.x += (150 * boss.moveDir) * dt;
                if (boss.x > 650) boss.moveDir = -1; // Bounce off right
                if (boss.x < 150) boss.moveDir = 1;  // Bounce off left

                // Check for Phase 2 Transition (Below 50% HP)
                if (boss.phase === 1 && boss.hp <= boss.maxHp / 2) {
                    boss.phase = 2;
                    boss.setTint(0xff5555); // Turn angry red
                    boss.actionTimer = 60;  // Instantly reset timer for a fast attack
                }

                // Attack Timers
                boss.actionTimer -= dt;
                if (boss.actionTimer <= 0) {
                    if (boss.phase === 1) {
                        // PHASE 1: Spawn 2 diving minions directly from the boss
                        let spawned = 0;
                        for (let enemy of this.my.sprite.enemyGroup.getChildren()) {
                            // Grab inactive fighters
                            if (!enemy.active && spawned < 2) {
                                enemy.active = true;
                                enemy.visible = true;
                                enemy.x = boss.x + (spawned === 0 ? -60 : 60); // Drop one on left port, one on right port
                                enemy.y = boss.y + 40;
                                
                                // Send them straight into the 'diving' state
                                enemy.state = 'diving';
                                enemy.diveDir = (spawned === 0) ? -1 : 1; 
                                enemy.vx = 250 * enemy.diveDir; 
                                enemy.vy = 100; 
                                spawned++;
                            }
                        }
                        boss.actionTimer = 3.0; // Wait 3 seconds before spawning more
                    } 
                    else if (boss.phase === 2) {
                        // PHASE 2: Bullet Hell Spiral
                        let bulletsToFire = 16;
                        let angleStep = (Math.PI * 2) / bulletsToFire;

                        for (let i = 0; i < bulletsToFire; i++) {
                            // Grab from the boss bullet pool
                            let bullet = this.my.sprite.bossBulletGroup.getFirstDead();
                            if (bullet != null) {
                                bullet.active = true;
                                bullet.visible = true;
                                bullet.x = boss.x;
                                bullet.y = boss.y;
                                
                                // Calculate angle with the spiral offset
                                let angle = (i * angleStep) + boss.spiralAngle;
                                bullet.vx = Math.cos(angle) * 250;
                                bullet.vy = Math.sin(angle) * 250;
                            }
                        }
                        this.sound.play('sfx_enemy_laser', { volume: 0.3 });
                        
                        // Shift the angle for the next burst to create a spiral effect
                        boss.spiralAngle += 0.2; 
                        boss.actionTimer = 1.5; 
                    }
                }
            }
        }

        // collision detection: player bullets vs asteroids
        for (let bullet of this.my.sprite.bulletGroup.getChildren()) {
            for (let asteroid of this.my.sprite.asteroidGroup.getChildren()) {
                
                // Only check collision if both objects are currently active on screen
                if (bullet.active && asteroid.active) {
                    if (this.collides(bullet, asteroid)) {
                        this.spawnHitSpark(bullet.x, bullet.y, 'laser_hit');
                        // Deactivate bullet and asteroid
                        bullet.active = false;
                        bullet.visible = false;
                        asteroid.hp -= 1;
                        if (asteroid.hp <= 0) {
                            // Destroy the asteroid
                            asteroid.active = false;
                            asteroid.visible = false;
                            this.spawnExplosion(asteroid.x, asteroid.y);
                            // Add to score (+100 for large asteroids)
                            this.score += 100;
                            this.scoreText.setText('SCORE: ' + this.score);
                            this.sound.play('sfx_explosion', { volume: 0.25 });
                        } else {
                            asteroid.setTint(0xff8888); 
                            this.sound.play('sfx_damage', { volume: 0.2 });
                        }
                    }
                }
            }
        }

        // collision detection: player vs asteroids
        if (my.sprite.player.active) {
            for (let asteroid of my.sprite.asteroidGroup.getChildren()) {
                if (asteroid.active) {
                    if (this.collides(my.sprite.player, asteroid)) {
                        // Destroy the asteroid so it doesn't hit us multiple times per frame
                        asteroid.active = false;
                        asteroid.visible = false;

                        // Apply 2 damage for physical collisions
                        this.takeDamage(2);
                    }
                }
            }
        }

        // collision detection: player bullet vs enemy fighter
        for (let bullet of this.my.sprite.bulletGroup.getChildren()) {
            for (let enemy of this.my.sprite.enemyGroup.getChildren()) {
                if (bullet.active && enemy.active && this.collides(bullet, enemy)) {
                    this.spawnHitSpark(bullet.x, bullet.y, 'laser_hit');
                    this.spawnExplosion(enemy.x, enemy.y);
                    bullet.active = false;
                    bullet.visible = false;
                    enemy.active = false;
                    enemy.visible = false;
                    enemy.exhaust.visible = false;
                    this.score += 50;
                    this.scoreText.setText('SCORE: ' + this.score);
                    this.sound.play('sfx_explosion', { volume: 0.25 });
                }
            }
        }

        // collision detection: enemy bullet OR fighter vs player
        if (my.sprite.player.active) {
            // enemy bullet vs player
            for (let bullet of this.my.sprite.enemyBulletGroup.getChildren()) {
                if (bullet.active && this.collides(my.sprite.player, bullet)) {
                    this.spawnHitSpark(bullet.x, bullet.y, 'laser_hit_red');
                    bullet.active = false;
                    bullet.visible = false;
                    this.takeDamage(1);
                }
            }
            // enemy fighter vs player
            for (let enemy of this.my.sprite.enemyGroup.getChildren()) {
                if (enemy.active && this.collides(my.sprite.player, enemy)) {
                    enemy.active = false;
                    enemy.visible = false;
                    enemy.exhaust.visible = false;
                    this.takeDamage(2);
                }
            }
            // boss bullet vs player
            for (let bullet of this.my.sprite.bossBulletGroup.getChildren()) {
                if (bullet.active && this.collides(my.sprite.player, bullet)) {
                    this.spawnHitSpark(bullet.x, bullet.y, 'laser_hit_green');
                    bullet.active = false;
                    bullet.visible = false;
                    this.takeDamage(1);
                }
            }
        }

        // collision detection: boss
        if (boss && boss.active) {
            // Player Bullet vs Boss
            for (let bullet of this.my.sprite.bulletGroup.getChildren()) {
                if (bullet.active && this.collides(bullet, boss)) {
                    this.spawnHitSpark(bullet.x, bullet.y, 'laser_hit');
                    bullet.active = false;
                    bullet.visible = false;
                    
                    boss.hp -= 1;
                    
                    if (boss.hp <= 0) {
                        // Boss Defeated
                        boss.active = false;
                        boss.visible = false;
                        this.score += 1000;
                        this.scoreText.setText('SCORE: ' + this.score);
                        this.sound.play('sfx_explosion', { volume: 0.8 });
                        this.spawnExplosion(boss.x, boss.y);
                        setTimeout(() => { this.spawnExplosion(boss.x - 40, boss.y - 20); }, 100);
                        setTimeout(() => { this.spawnExplosion(boss.x + 50, boss.y + 30); }, 200);
                        setTimeout(() => { this.spawnExplosion(boss.x - 20, boss.y + 40); }, 300);
                        setTimeout(() => { this.spawnExplosion(boss.x + 10, boss.y - 50); }, 400);
                    } else {
                        this.sound.play('sfx_damage', { volume: 0.3 });
                    }
                }
            }

            // Boss vs Player Crash (Insta-kill)
            if (my.sprite.player.active && this.collides(my.sprite.player, boss)) {
                this.takeDamage(3); 
            }
        }

        // update enemy bullets
        for (let bullet of this.my.sprite.enemyBulletGroup.getChildren()) {
            if (bullet.active) {
                bullet.x += bullet.vx * dt;
                bullet.y += bullet.vy * dt;
                // Check for off-screen in any direction
                if (bullet.y > 950 || bullet.y < -50 || bullet.x < -50 || bullet.x > 850) {
                    bullet.active = false;
                    bullet.visible = false;
                }
            }
        }

        // update boss bullets
        for (let bullet of this.my.sprite.bossBulletGroup.getChildren()) {
            if (bullet.active) {
                bullet.x += bullet.vx * dt;
                bullet.y += bullet.vy * dt; 
                
                // Check for off-screen in any direction
                if (bullet.y > 950 || bullet.y < -50 || bullet.x < -50 || bullet.x > 850) {
                    bullet.active = false;
                    bullet.visible = false;
                }
            }
        }

        // update enemy fighters
        for (let enemy of this.my.sprite.enemyGroup.getChildren()) {
            if (enemy.active) {
                
                // Turn exhaust on and sync position to the top of the enemy ship
                enemy.exhaust.visible = true;
                enemy.exhaust.x = enemy.x;
                enemy.exhaust.y = enemy.y - (enemy.displayHeight / 2);

                // State: Entering the screen
                if (enemy.state === 'entering') {
                    enemy.y += 250 * dt; 
                    
                    // Check against their individual stop points
                    if (enemy.y >= enemy.stopY) { 
                        enemy.y = enemy.stopY; // Snap perfectly to position
                        enemy.state = 'holding';
                    }
                } 
                // State: Holding position and shooting
                else if (enemy.state === 'holding') {
                    enemy.holdTimer -= dt;
                    
                    // Random chance to fire while holding
                    if (Phaser.Math.Between(0, 100) > 98) { 
                        let bullet = this.my.sprite.enemyBulletGroup.getFirstDead();
                        if (bullet != null) {
                            bullet.active = true;
                            bullet.visible = true;
                            this.sound.play('sfx_enemy_laser', { volume: 0.15 });
                            bullet.x = enemy.x;
                            bullet.y = enemy.y + (enemy.displayHeight / 2);
                            bullet.vx = 0; 
                            bullet.vy = 400;
                        }
                    }

                    if (enemy.holdTimer <= 0) {
                        enemy.state = 'diving';
                        
                        // Initialize Parabolic Dive Physics
                        // Burst outward based on their side, middle goes straight down
                        enemy.vx = 250 * enemy.diveDir; 
                        enemy.vy = 100; // Small initial drop speed
                    }
                } 
                // State: Diving towards the bottom
                else if (enemy.state === 'diving') {
                    
                    // Acceleration: Constantly pull the horizontal velocity inward
                    if (enemy.diveDir !== 0) {
                        enemy.vx -= (450 * enemy.diveDir) * dt; 
                    }
                    
                    // Gravity: Constantly accelerate downward
                    enemy.vy += 300 * dt; 

                    // terminal velocity (speed caps)
                    let maxVerticalSpeed = 350; // Maximum downward speed
                    let maxHorizontalSpeed = 300; // Maximum sideways speed
                    
                    // Cap the Y velocity
                    if (enemy.vy > maxVerticalSpeed) {
                        enemy.vy = maxVerticalSpeed;
                    }
                    
                    // Cap the X velocity (using Math.abs to handle both left and right directions)
                    if (Math.abs(enemy.vx) > maxHorizontalSpeed) {
                        // Math.sign keeps it negative if it was moving left, positive if moving right
                        enemy.vx = maxHorizontalSpeed * Math.sign(enemy.vx); 
                    }

                    // Apply the physics to their actual coordinates
                    enemy.x += enemy.vx * dt;
                    enemy.y += enemy.vy * dt;

                    // Despawn off bottom
                    if (enemy.y > 950) {
                        enemy.active = false;
                        enemy.visible = false;
                        enemy.exhaust.visible = false;
                    }
                }
            }
        }
    }

    // Spawns a V-formation of 5 fighters
    spawnFighterFormation() {
        let startX = [200, 300, 400, 500, 600];
        // Stagger the starting heights so they arrive on screen roughly together
        let startY = [-100, -150, -200, -150, -100]; 
        // Unique stopping points to maintain the V-Shape
        let stopY = [100, 150, 200, 150, 100]; 
        
        let i = 0;

        for (let enemy of this.my.sprite.enemyGroup.getChildren()) {
            if (!enemy.active && i < 5) {
                enemy.active = true;
                enemy.visible = true;
                enemy.x = startX[i];
                enemy.y = startY[i];
                
                // State Machine Properties
                enemy.state = 'entering'; 
                enemy.stopY = stopY[i];
                
                // Stagger the hold timer so they dive sequentially (left to right)
                // Each ship waits an extra 0.5 seconds before diving
                enemy.holdTimer = 2.0 + (i * 0.5); 
                
                // Determine diving direction (-1 for left, 1 for right, 0 for middle)
                enemy.diveDir = (enemy.x < 400) ? -1 : (enemy.x > 400 ? 1 : 0); 
                
                // Add variables to handle arcing physics later
                enemy.vx = 0;
                enemy.vy = 0;
                
                i++;
            }
        }
    }

    // AABB Collision check
    collides(a, b) {
        if (Math.abs(a.x - b.x) > (a.displayWidth / 2 + b.displayWidth / 2)) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight / 2 + b.displayHeight / 2)) return false;
        return true;
    }
    
    // Initializes and drops the Boss UFO into the arena
    spawnBoss() {
        let boss = this.my.sprite.boss;
        boss.active = true;
        boss.visible = true;
        boss.x = 400; // Start in center
        boss.y = -150; // Start off-screen top
        
        boss.hp = 50; 
        boss.maxHp = 50;
        
        boss.state = 'entering';
        boss.phase = 1;
        boss.moveDir = 1; // 1 for moving right, -1 for moving left
        boss.actionTimer = 2.0; // 2 seconds before first attack
        boss.clearTint();
        boss.spiralAngle = 0;
    }

    // function for wave clear transition (hyperspace warp)
    triggerWaveClear() {
        this.waveTransitioning = true;
        this.pulseActive = false;

        // Display Text
        let clearText = this.add.text(400, 400, 'WAVE CLEARED', {
            fontSize: '48px',
            fill: '#00FF00',
            fontFamily: 'Courier',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Hyperspace Warp Out
        // Make the exhaust visually larger for the jump
        this.my.sprite.playerExhaust.setTexture('warp_exhaust');

        this.tweens.add({
            targets: [this.my.sprite.player, this.my.sprite.playerExhaust],
            y: -100, // Fly up and off the top of the canvas
            duration: 1000, // Takes 1 second
            ease: 'Power2', // Starts slow, speeds up
            delay: 1000, // Wait 1 second before jumping so player can read text
            onComplete: () => {
                clearText.destroy(); // Remove the text

                // Reset Wave Variables for Increased Difficulty
                this.currentWave++;
                this.currentPulse = 1;
                this.pulseDelayCounter = 2.0;
                
                // Teleport ship below the bottom of the screen
                this.my.sprite.player.y = 1000; 
                this.my.sprite.playerExhaust.setTexture('player_exhaust'); // Reset exhaust sprite
                
                // Warp Back In
                this.tweens.add({
                    targets: [this.my.sprite.player, this.my.sprite.playerExhaust],
                    y: 800, // Back to starting position
                    duration: 1000,
                    ease: 'Power2',
                    onComplete: () => {
                        this.waveTransitioning = false; // Resume gameplay
                    }
                });
            }
        });
    }

    // Function to spawn a hit spark at a specific coordinate
    spawnHitSpark(x, y, animKey) {
        let spark = this.my.sprite.sparkGroup.getFirstDead();
        if (spark != null) {
            spark.active = true;
            spark.visible = true;
            spark.x = x;
            spark.y = y;
            
            // Play the animation
            spark.play(animKey);
            
            // Once the animation finishes, reset the sprite to the pool
            spark.once('animationcomplete', () => {
                spark.active = false;
            });
        }
    }

    // Function to spawn an explosion at a specific coordinate
    spawnExplosion(x, y) {
        let explosion = this.my.sprite.explosionGroup.getFirstDead();
        if (explosion != null) {
            explosion.active = true;
            explosion.visible = true;
            explosion.x = x;
            explosion.y = y;
            
            // Randomize the rotation slightly for visual variety
            explosion.angle = Phaser.Math.Between(0, 360);
            
            explosion.play('explode');
            
            explosion.once('animationcomplete', () => {
                explosion.active = false;
            });
        }
    }

    // function for taking damage
    takeDamage(amount) {
        // If the player is already dead, ignore further damage
        if (!this.my.sprite.player.active) return;
        this.playerHealth -= amount;
        
        // Prevent health from dropping below 0
        if (this.playerHealth < 0) this.playerHealth = 0; 

        // visual damage overlay
        if (this.playerHealth === 2) {
            this.my.sprite.playerDamage.visible = true;
            this.my.sprite.playerDamage.setTexture('player_damage1');
        } else if (this.playerHealth === 1) {
            this.my.sprite.playerDamage.visible = true;
            this.my.sprite.playerDamage.setTexture('player_damage2');
        } else if (this.playerHealth <= 0) {
            // Hide the overlay when they blow up
            this.my.sprite.playerDamage.visible = false; 
        }

        // Update UI icons based on current health
        for (let i = 0; i < this.healthIcons.length; i++) {
            this.sound.play('sfx_damage', { volume: 0.5 });
            // If the icon's index is greater than or equal to current health, hide it
            this.healthIcons[i].visible = (i < this.playerHealth);
        }

        // game over check
        if (this.playerHealth <= 0) {
            this.isGameOver = true; // Flip the flag

            // Explode the ship
            this.spawnExplosion(this.my.sprite.player.x, this.my.sprite.player.y);
            this.sound.play('sfx_explosion', { volume: 0.8 });
            this.my.sprite.player.active = false;
            this.my.sprite.player.visible = false;
            this.my.sprite.playerExhaust.visible = false;

            // Display Game Over Text in the center
            this.add.text(400, 450, 'GAME OVER', { 
                fontSize: '64px', 
                fill: '#FF0000', 
                fontFamily: 'Courier',
                fontStyle: 'bold' 
            }).setOrigin(0.5); // setOrigin(0.5) perfectly centers the text on these coordinates

            // Display restart prompt
            this.add.text(400, 500, 'Press [R] to Return to Main Menu', { 
                fontSize: '24px', 
                fill: '#FFFFFF', 
                fontFamily: 'Courier'
            }).setOrigin(0.5);
        }
    }

    init_game() {
        this.playerHealth = 3; 
        this.score = 0;
        this.currentWave = 1;
        this.currentPulse = 1;
        this.pulseActive = false;
        this.waveTransitioning = false;
        this.pulseDelayCounter = 2.0;
        this.asteroidsToSpawn = 0;         
        this.isGameOver = false;
    }
}