// Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 900, // Taller canvas for a vertical shooter
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [ Title, Play ]
};

// Initialize the Phaser Game
const game = new Phaser.Game(config);