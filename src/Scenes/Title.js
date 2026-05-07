class Title extends Phaser.Scene {
    constructor() {
        super('titleScene');
    }

    preload() {
        this.load.image('starfield', './assets/images/black.png');
    }

    create() {
        // Add a slow-scrolling background
        this.starfield = this.add.tileSprite(400, 450, 800, 900, 'starfield');

        // Main Title Text
        this.add.text(400, 300, 'HELIOS WARP DIVE', {
            fontSize: '64px',
            fill: '#FFFFFF',
            fontFamily: 'Courier',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Start Prompt
        this.add.text(400, 500, 'Press SPACE to Start', {
            fontSize: '32px',
            fill: '#00FF00',
            fontFamily: 'Courier'
        }).setOrigin(0.5);

        // Set up the space key
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update(time, delta) {
        let dt = delta / 1000;
        
        // Slower scroll for the menu
        this.starfield.tilePositionY -= 50 * dt; 

        // Transition to the Play scene when Space is pressed
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.scene.start('playScene');
        }
    }
}